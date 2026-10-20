'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { list, str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { readEvents, readHeaders } from './kinds';
import { runSecret, type SecretState } from './secret';

export async function createSlackChannel(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const channel = unwrap(
      await mentio().createChannel({
        body: { kind: 'slack', channelId: str(form, 'channelId'), channelName: str(form, 'channelName').replace(/^#/, '') },
      }),
    );
    revalidatePath('/channels');
    redirect(`/channels/${channel.id}`);
  });
}

export async function createEmailChannel(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const emails = list(form, 'emails');
    if (emails.length === 0) throw new Error('Agrega al menos una dirección.');
    const channel = unwrap(await mentio().createChannel({ body: { kind: 'email', emails } }));
    revalidatePath('/channels');
    redirect(`/channels/${channel.id}`);
  });
}

/** The signing secret comes back once, on this response: the form shows it before moving on. */
export async function createWebhookChannel(_: SecretState, form: FormData): Promise<SecretState> {
  return runSecret(async () => {
    const label = str(form, 'label');
    const events = readEvents(form);
    const headers = readHeaders(form);
    const channel = unwrap(
      await mentio().createChannel({
        body: {
          kind: 'webhook',
          url: str(form, 'url'),
          ...(label ? { label } : {}),
          ...(Object.keys(headers).length ? { headers } : {}),
          ...(events.length ? { events } : {}),
        },
      }),
    );
    revalidatePath('/channels');
    const secret = channel.kind === 'webhook' ? channel.config.secret : undefined;
    if (!secret) redirect(`/channels/${channel.id}`);
    return { ok: 'Webhook creado', secret, href: `/channels/${channel.id}` };
  });
}

export async function updateChannelAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const webhook = str(form, 'kind') === 'webhook';
    unwrap(
      await mentio().updateChannel({
        path: { id },
        body: {
          label: str(form, 'label'),
          ...(webhook ? { url: str(form, 'url'), headers: readHeaders(form), events: readEvents(form) } : {}),
        },
      }),
    );
    revalidatePath('/channels');
    revalidatePath(`/channels/${id}`);
    return 'Canal guardado';
  });
}

export async function testChannelAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const { outcomes } = unwrap(await mentio().testChannel({ path: { id } }));
    revalidatePath(`/channels/${id}`);
    const failed = outcomes.filter((o) => !o.ok);
    if (failed.length) throw new Error(`La prueba falló: ${failed.map((o) => o.error ?? 'sin motivo indicado').join('; ')}`);
    return 'Prueba enviada. Revisa el canal.';
  });
}

export async function rotateSecretAction(_: SecretState, form: FormData): Promise<SecretState> {
  return runSecret(async () => {
    const id = str(form, 'id');
    const channel = unwrap(await mentio().rotateWebhookSecret({ path: { id } }));
    const secret = channel.kind === 'webhook' ? channel.config.secret : undefined;
    if (!secret) throw new Error('La API no devolvió una clave nueva.');
    return { ok: 'Clave rotada. La anterior dejó de funcionar.', secret };
  });
}

export async function deleteChannelAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    unwrap(await mentio().deleteChannel({ path: { id: str(form, 'id') } }));
    revalidatePath('/channels');
    redirect('/channels');
  });
}
