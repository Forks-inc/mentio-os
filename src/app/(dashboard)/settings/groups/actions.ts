'use server';

import type { UpdateGroupData } from '@mentio-dev/sdk';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { bool, str, strOrNull } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';

export async function createGroupAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const externalId = strOrNull(form, 'externalId');
    const context = strOrNull(form, 'context');
    const group = unwrap(
      await mentio().createGroup({
        body: { name: str(form, 'name'), ...(externalId ? { externalId } : {}), ...(context ? { context } : {}) },
      }),
    );
    revalidatePath('/settings/groups');
    redirect(`/settings/groups/${group.id}`);
  });
}

export async function updateGroupAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const body: NonNullable<UpdateGroupData['body']> = { name: str(form, 'name'), externalId: strOrNull(form, 'externalId') };
    // The default group is the workspace itself: it takes no description of its own.
    if (!bool(form, 'isDefault')) body.context = strOrNull(form, 'context');
    unwrap(await mentio().updateGroup({ path: { id }, body }));
    revalidatePath('/settings/groups');
    revalidatePath(`/settings/groups/${id}`);
    return 'Saved';
  });
}

export async function deleteGroupAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const result = await mentio().deleteGroup({ path: { id } });
    if (result.error !== undefined) unwrap(result);
    revalidatePath('/settings/groups');
    revalidatePath('/keywords');
    redirect('/settings/groups');
  });
}
