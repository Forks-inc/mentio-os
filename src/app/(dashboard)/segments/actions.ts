'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { audienceFilter, formToParams } from '../people/filters';

/** Creates a segment from the editor's fields and opens it. */
export async function createSegment(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const name = str(form, 'name');
    if (!name) throw new Error('Give the segment a name.');
    const segment = unwrap(
      await mentio().createSegment({ body: { name, description: str(form, 'description'), filter: audienceFilter(formToParams(form)) } }),
    );
    revalidatePath('/segments');
    redirect(`/segments/${segment.id}`);
  });
}

/** Saves one of the API's presets as your own segment. */
export async function savePreset(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { presets } = unwrap(await mentio().listSegments());
    const preset = presets.find((p) => p.key === str(form, 'key'));
    if (!preset) throw new Error('That preset no longer exists.');
    unwrap(await mentio().createSegment({ body: { name: preset.name, description: preset.description, filter: preset.filter } }));
    revalidatePath('/segments');
    return `Saved ${preset.name}`;
  });
}

/** Name, description and the whole filter (the editor always sends every condition). */
export async function updateSegment(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const name = str(form, 'name');
    if (!name) throw new Error('A segment needs a name.');
    unwrap(
      await mentio().updateSegment({
        path: { id },
        body: { name, description: str(form, 'description'), filter: audienceFilter(formToParams(form)) },
      }),
    );
    revalidatePath('/segments');
    revalidatePath(`/segments/${id}`);
    return 'Saved';
  });
}

export async function deleteSegment(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    unwrap(await mentio().deleteSegment({ path: { id: str(form, 'id') } }));
    revalidatePath('/segments');
    redirect('/segments');
  });
}
