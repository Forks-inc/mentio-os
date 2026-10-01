'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { getterFromForm, parseFilters, toViewFilter } from '@/app/(dashboard)/mentions/filters';

export async function createView(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const name = str(form, 'name');
    if (!name) throw new Error('Give the view a name.');
    const view = unwrap(
      await mentio().createView({ body: { name, description: str(form, 'description'), filter: toViewFilter(parseFilters(getterFromForm(form))) } }),
    );
    revalidatePath('/views');
    redirect(`/views/${encodeURIComponent(view.id)}`);
  });
}

/** Name, description and the whole filter in one PATCH: the form holds every condition. */
export async function updateView(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const name = str(form, 'name');
    if (!name) throw new Error('Give the view a name.');
    unwrap(
      await mentio().updateView({ path: { id }, body: { name, description: str(form, 'description'), filter: toViewFilter(parseFilters(getterFromForm(form))) } }),
    );
    revalidatePath('/views');
    revalidatePath(`/views/${id}`);
    revalidatePath('/mentions');
  });
}

export async function deleteView(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const result = await mentio().deleteView({ path: { id } });
    if (result.error !== undefined) unwrap(result);
    revalidatePath('/views');
    revalidatePath('/mentions');
    redirect('/views');
  });
}
