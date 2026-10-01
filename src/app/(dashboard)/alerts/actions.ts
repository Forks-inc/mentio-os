'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { bool, lines, list, str, strOrNull } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { readFilter, readMode, readSchedule } from './rule';

type Outcome = { channelId: string; ok: boolean; error: string | null };

/** "Sent to #alerts and Team email." or, when one failed, an error naming it. */
async function reportOutcomes(id: string, outcomes: Outcome[], verb: string) {
  if (outcomes.length === 0) throw new Error('This alert has no channels. Add one, then try again.');
  const alert = unwrap(await mentio().getAlert({ path: { id } }));
  const label = (channelId: string) => alert.channels.find((c) => c.id === channelId)?.label ?? channelId;
  const sent = outcomes.filter((o) => o.ok).map((o) => label(o.channelId));
  const failed = outcomes.filter((o) => !o.ok).map((o) => `${label(o.channelId)} (${o.error ?? 'failed'})`);
  if (failed.length) throw new Error(`${sent.length ? `${verb} to ${sent.join(', ')}. ` : ''}Failed: ${failed.join('; ')}.`);
  return `${verb} to ${sent.join(', ')}.`;
}

export async function createAlertAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const mode = readMode(form);
    const schedule = readSchedule(form, mode);
    const alert = unwrap(
      await mentio().createAlert({
        body: {
          name: str(form, 'name'),
          enabled: bool(form, 'enabled'),
          mode,
          filter: readFilter(form, lines(form, 'excludeAuthors')),
          ...(schedule ? { schedule } : {}),
          event: strOrNull(form, 'event'),
          channelIds: list(form, 'channelIds'),
        },
      }),
    );
    revalidatePath('/alerts');
    redirect(`/alerts/${alert.id}`);
  });
}

export async function updateAlertAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    // Muted authors are edited on their own (mute/unmute); keep the live list so this save never undoes one.
    const current = unwrap(await mentio().getAlert({ path: { id } }));
    const mode = readMode(form);
    unwrap(
      await mentio().updateAlert({
        path: { id },
        body: {
          name: str(form, 'name'),
          enabled: bool(form, 'enabled'),
          mode,
          filter: readFilter(form, current.filter.excludeAuthors ?? []),
          schedule: readSchedule(form, mode),
          event: strOrNull(form, 'event'),
          channelIds: list(form, 'channelIds'),
        },
      }),
    );
    revalidatePath('/alerts');
    revalidatePath(`/alerts/${id}`);
    return 'Alert saved';
  });
}

export async function setAlertEnabled(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const enabled = bool(form, 'enabled');
    unwrap(await mentio().updateAlert({ path: { id }, body: { enabled } }));
    revalidatePath('/alerts');
    revalidatePath(`/alerts/${id}`);
    return enabled ? 'Enabled' : 'Disabled';
  });
}

export async function deleteAlertAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    unwrap(await mentio().deleteAlert({ path: { id: str(form, 'id') } }));
    revalidatePath('/alerts');
    redirect('/alerts');
  });
}

export async function testAlertAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const { outcomes } = unwrap(await mentio().testAlert({ path: { id } }));
    return reportOutcomes(id, outcomes, 'Test sent');
  });
}

export async function runDigestAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const result = unwrap(await mentio().runAlertDigest({ path: { id } }));
    revalidatePath(`/alerts/${id}`);
    if (result.skipped === 'empty') return 'Nothing matched in the last 24 hours, so nothing was sent.';
    if (result.skipped === 'already_sent') return 'This digest was already sent.';
    return reportOutcomes(id, result.outcomes, `Digest of ${result.matched} mentions (${result.relevant} relevant) sent`);
  });
}

export async function muteAuthorsAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const authors = lines(form, 'authors');
    if (authors.length === 0) throw new Error('Paste at least one author.');
    unwrap(await mentio().muteAlertAuthors({ path: { id }, body: { authors } }));
    revalidatePath(`/alerts/${id}`);
    return authors.length === 1 ? 'Author muted' : `${authors.length} authors muted`;
  });
}

export async function unmuteAuthorAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    unwrap(await mentio().unmuteAlertAuthors({ path: { id }, body: { authors: [str(form, 'author')] } }));
    revalidatePath(`/alerts/${id}`);
    return 'Unmuted';
  });
}
