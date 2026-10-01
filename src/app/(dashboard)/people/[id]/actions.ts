'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { bool, isOneOf, list, str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { STAGES } from '../filters';
import { ACTIVITY_CHANNELS } from './channels';

const refresh = (id: string) => {
  revalidatePath(`/people/${id}`);
  revalidatePath('/people');
};

/** Tags, notes, mute, owner and stage in one PATCH. */
export async function updatePerson(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const stage = str(form, 'stage');
    const owner = str(form, 'ownerId');
    unwrap(
      await mentio().updatePerson({
        path: { id },
        body: {
          tags: [...new Set(list(form, 'tags'))],
          notes: str(form, 'notes'),
          muted: bool(form, 'muted'),
          ownerId: owner || null,
          ...(isOneOf(STAGES, stage) ? { stage } : {}),
        },
      }),
    );
    refresh(id);
    return 'Saved';
  });
}

export async function logActivity(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const channel = str(form, 'channel');
    if (!isOneOf(ACTIVITY_CHANNELS, channel)) throw new Error('Pick how you reached them.');
    const when = str(form, 'occurredAt');
    const occurredAt = when ? new Date(`${when}Z`) : null;
    if (occurredAt && Number.isNaN(occurredAt.getTime())) throw new Error('That date is not valid.');
    unwrap(
      await mentio().logPersonActivity({
        path: { id },
        body: { channel, note: str(form, 'note'), ...(occurredAt ? { occurredAt: occurredAt.toISOString() } : {}) },
      }),
    );
    refresh(id);
    return 'Logged';
  });
}

export async function deleteActivity(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    unwrap(await mentio().deletePersonActivity({ path: { id, activityId: str(form, 'activityId') } }));
    refresh(id);
    return 'Deleted';
  });
}

/** Folds `from` into `into`; the page then shows the person that remains. */
export async function mergePeople(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const from = str(form, 'from');
    const into = str(form, 'into');
    if (!from || !into) throw new Error('Pick a person to merge with.');
    if (from === into) throw new Error('That is the same person.');
    const person = unwrap(await mentio().mergePeople({ path: { id: from }, body: { into } }));
    refresh(from);
    refresh(person.id);
    redirect(`/people/${person.id}`);
  });
}

/** Turns one merged account back into its own person. */
export async function splitAccount(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    unwrap(await mentio().splitPerson({ path: { id: str(form, 'accountId') } }));
    refresh(id);
    return 'Split out';
  });
}
