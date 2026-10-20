'use server';

import { revalidatePath } from 'next/cache';
import { run, type ActionState } from '@/lib/action';
import { str, strOrNull } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';

/** One entry per line (a use case may well contain a comma). */
const lines = (form: FormData, key: string) =>
  str(form, key)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Saves the part of the profile a card holds: each settings card submits its
 * own fields, and only fields present in the form are sent, so saving the
 * brand never clears the guidelines.
 */
export async function updateProfileAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const has = (key: string) => form.has(key);
    const body: Parameters<ReturnType<typeof mentio>['updateCompany']>[0]['body'] = {
      ...(has('name') ? { name: str(form, 'name') } : {}),
      ...(has('website') ? { website: strOrNull(form, 'website') } : {}),
      ...(has('description') ? { description: str(form, 'description') } : {}),
      ...(has('useCases') ? { useCases: lines(form, 'useCases') } : {}),
      ...(has('competitors') ? { competitors: lines(form, 'competitors') } : {}),
      ...(has('guidelines') ? { guidelines: strOrNull(form, 'guidelines') } : {}),
      ...(has('x') || has('linkedin') ? { accounts: { x: strOrNull(form, 'x')?.replace(/^@/, '') ?? null, linkedin: strOrNull(form, 'linkedin') } } : {}),
    };
    unwrap(await mentio().updateCompany({ body }));
    revalidatePath('/settings/company');
    return 'Guardado. Las menciones nuevas se evaluarán con este contexto.';
  });
}

export async function updateContextAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    unwrap(await mentio().updateCompany({ body: { context: str(form, 'context') } }));
    revalidatePath('/settings/company');
    return 'Guardado';
  });
}
