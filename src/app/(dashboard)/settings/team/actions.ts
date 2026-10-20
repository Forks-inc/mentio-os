'use server';

import { revalidatePath } from 'next/cache';
import { run, type ActionState } from '@/lib/action';
import { str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';

/**
 * Team changes need a signed-in owner or admin, so the API answers 403
 * `forbidden` to an API key. Say where the change can be made instead.
 */
async function teamWrite<T>(result: Promise<{ data?: T; error?: unknown }>) {
  try {
    return unwrap(await result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('forbidden')) {
      throw new Error('Para cambiar el equipo, inicia sesión como propietario o administrador desde el panel de administración.');
    }
    throw error;
  }
}

export async function inviteAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const role = str(form, 'role') === 'admin' ? 'admin' : 'member';
    const invitation = await teamWrite(mentio().createInvitation({ body: { email: str(form, 'email'), role } }));
    revalidatePath('/settings/team');
    return `Invitación enviada a ${invitation.email}`;
  });
}

export async function revokeInvitationAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    await teamWrite(mentio().revokeInvitation({ path: { id: str(form, 'id') } }));
    revalidatePath('/settings/team');
    return 'Invitación cancelada';
  });
}

export async function removeMemberAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    await teamWrite(mentio().removeMember({ path: { id: str(form, 'id') } }));
    revalidatePath('/settings/team');
    return 'Miembro eliminado';
  });
}
