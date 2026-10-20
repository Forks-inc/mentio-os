'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { bool, lines, list, str, strOrNull } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { readFilter, readMode, readSchedule } from './rule';

type Outcome = { channelId: string; ok: boolean; error: string | null };

/** Resumen de canales con envío correcto o fallido. */
async function reportOutcomes(id: string, outcomes: Outcome[], verb: string) {
  if (outcomes.length === 0) throw new Error('Esta alerta no tiene canales. Agrega uno e inténtalo de nuevo.');
  const alert = unwrap(await mentio().getAlert({ path: { id } }));
  const label = (channelId: string) => alert.channels.find((c) => c.id === channelId)?.label ?? channelId;
  const sent = outcomes.filter((o) => o.ok).map((o) => label(o.channelId));
  const failed = outcomes.filter((o) => !o.ok).map((o) => `${label(o.channelId)} (${o.error ?? 'falló'})`);
  if (failed.length) throw new Error(`${sent.length ? `${verb} en ${sent.join(', ')}. ` : ''}Falló el envío: ${failed.join('; ')}.`);
  return `${verb} en ${sent.join(', ')}.`;
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
    return 'Alerta guardada';
  });
}

export async function setAlertEnabled(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const enabled = bool(form, 'enabled');
    unwrap(await mentio().updateAlert({ path: { id }, body: { enabled } }));
    revalidatePath('/alerts');
    revalidatePath(`/alerts/${id}`);
    return enabled ? 'Alerta activada' : 'Alerta desactivada';
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
    return reportOutcomes(id, outcomes, 'Prueba enviada');
  });
}

export async function runDigestAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const result = unwrap(await mentio().runAlertDigest({ path: { id } }));
    revalidatePath(`/alerts/${id}`);
    if (result.skipped === 'empty') return 'No hubo coincidencias en las últimas 24 horas, así que no se envió nada.';
    if (result.skipped === 'already_sent') return 'Este resumen ya se había enviado.';
    return reportOutcomes(id, result.outcomes, `Resumen de ${result.matched} menciones (${result.relevant} relevantes) enviado`);
  });
}

export async function muteAuthorsAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const authors = lines(form, 'authors');
    if (authors.length === 0) throw new Error('Agrega al menos un autor.');
    unwrap(await mentio().muteAlertAuthors({ path: { id }, body: { authors } }));
    revalidatePath(`/alerts/${id}`);
    return authors.length === 1 ? 'Autor silenciado' : `${authors.length} autores silenciados`;
  });
}

export async function unmuteAuthorAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    unwrap(await mentio().unmuteAlertAuthors({ path: { id }, body: { authors: [str(form, 'author')] } }));
    revalidatePath(`/alerts/${id}`);
    return 'Autor sin silenciar';
  });
}
