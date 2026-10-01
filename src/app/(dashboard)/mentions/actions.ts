'use server';

import type { UpdateMentionData } from '@mentio-dev/sdk';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { isOneOf, str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { SENTIMENTS, STATUSES, fromViewFilter, getterFromForm, narrow, parseFilters, toViewFilter } from './filters';

/**
 * The PATCH body as the API documents it: `snoozedUntil: null` wakes a
 * mention and `sentiment: null` withdraws a correction. The SDK's generated
 * type drops the null on those two fields, so the widened body is cast once here.
 */
type MentionPatch = Omit<UpdateMentionData['body'], 'snoozedUntil' | 'sentiment'> & {
  snoozedUntil?: string | null;
  sentiment?: UpdateMentionData['body']['sentiment'] | null;
};

async function patchMention(id: string, body: MentionPatch) {
  if (!id) throw new Error('Missing mention id.');
  unwrap(await mentio().updateMention({ path: { id }, body: body as UpdateMentionData['body'] }));
  revalidatePath('/mentions');
  revalidatePath(`/mentions/${id}`);
  revalidatePath('/');
}

/** Done, Ignore, Reopen: the button pressed carries the status. */
export async function setMentionStatus(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const status = str(form, 'status');
    if (!isOneOf(STATUSES, status)) throw new Error('Pick open, done or ignored.');
    await patchMention(str(form, 'id'), { status });
    return status === 'open' ? 'Reopened' : status === 'done' ? 'Marked done' : 'Ignored';
  });
}

/**
 * The same for many mentions at once (the bulk bar). The API has no bulk
 * call, so they go a few at a time, well inside the 600 a minute rate limit.
 */
export async function setStatusMany(ids: string[], status: string): Promise<ActionState> {
  return run(async () => {
    if (!isOneOf(STATUSES, status)) throw new Error('Pick open, done or ignored.');
    const todo = [...new Set(ids)].slice(0, 100);
    const api = mentio();
    for (let i = 0; i < todo.length; i += 5) {
      await Promise.all(todo.slice(i, i + 5).map(async (id) => unwrap(await api.updateMention({ path: { id }, body: { status } }))));
    }
    revalidatePath('/mentions');
    revalidatePath('/');
    const what = status === 'open' ? 'reopened' : status === 'done' ? 'marked done' : 'ignored';
    return `${todo.length} ${todo.length === 1 ? 'mention' : 'mentions'} ${what}`;
  });
}

/** Assignee and internal note, saved together. Empty means clear. */
export async function saveTriage(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    await patchMention(str(form, 'id'), {
      assigneeId: str(form, 'assigneeId') || null,
      note: str(form, 'note') || null,
    });
  });
}

const PRESETS: Record<string, number> = { hour: 60 * 60 * 1000, day: 24 * 60 * 60 * 1000, week: 7 * 24 * 60 * 60 * 1000 };

/** Snooze for a preset, until a chosen time (UTC), or wake it now. */
export async function snoozeMention(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const choice = str(form, 'snooze');
    if (choice === 'clear') {
      await patchMention(id, { snoozedUntil: null });
      return 'Back in the feed';
    }
    let until: Date;
    if (choice in PRESETS) {
      until = new Date(Date.now() + PRESETS[choice]!);
    } else {
      const raw = str(form, 'until');
      if (!raw) throw new Error('Pick a date and time.');
      until = new Date(`${raw}Z`);
      if (Number.isNaN(until.getTime())) throw new Error('That date is not valid.');
      if (until.getTime() <= Date.now()) throw new Error('Pick a time in the future.');
    }
    await patchMention(id, { snoozedUntil: until.toISOString() });
    return 'Snoozed';
  });
}

/** Correct the classifier: relevance (true, false, or reset) and sentiment (a value, or reset). */
export async function setVerdict(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const relevant = str(form, 'relevant');
    const sentiment = str(form, 'sentiment');
    const body: MentionPatch = {};
    if (relevant === 'true' || relevant === 'false') body.relevant = relevant === 'true';
    else if (relevant === 'reset') body.relevant = null;
    if (isOneOf(SENTIMENTS, sentiment)) body.sentiment = sentiment;
    else if (sentiment === 'reset') body.sentiment = null;
    if (Object.keys(body).length === 0) throw new Error('Nothing to change.');
    await patchMention(id, body);
    return 'Thanks, verdict saved';
  });
}

/** Add this author to an alert rule's muted list. */
export async function muteAuthorInAlert(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const alertId = str(form, 'alertId');
    const author = str(form, 'author');
    if (!alertId) throw new Error('Pick an alert.');
    if (!author) throw new Error('This mention has no author to mute.');
    const alert = unwrap(await mentio().muteAlertAuthors({ path: { id: alertId }, body: { authors: [author] } }));
    revalidatePath('/alerts');
    revalidatePath(`/alerts/${alertId}`);
    return `Muted in ${alert.name}`;
  });
}

/**
 * Save the feed's current filters as a view. When the page already applies a
 * view, the new one is that view narrowed by the page's own filters, exactly
 * what the page shows (minus the date window and the order, which views do not hold).
 */
export async function saveFeedAsView(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const name = str(form, 'name');
    if (!name) throw new Error('Give the view a name.');
    let values = parseFilters(getterFromForm(form));
    const baseId = str(form, 'viewId');
    if (baseId) {
      const base = unwrap(await mentio().getView({ path: { id: baseId } }));
      values = narrow(fromViewFilter(base.filter), values);
    }
    const view = unwrap(await mentio().createView({ body: { name, description: str(form, 'description'), filter: toViewFilter(values) } }));
    revalidatePath('/views');
    redirect(`/mentions?viewId=${encodeURIComponent(view.id)}`);
  });
}
