'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { audienceFilter, type AudienceFilter } from './filters';

/** Saves the people list's current filters (carried as its query string) as a segment. */
export async function saveAsSegment(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const name = str(form, 'name');
    if (!name) throw new Error('Give the segment a name.');
    const query = new URLSearchParams(str(form, 'query'));
    const filter: AudienceFilter = audienceFilter(Object.fromEntries([...query.keys()].map((key) => [key, query.getAll(key)])));
    if (Object.keys(filter).length === 0) throw new Error('Set at least one filter first.');
    const segment = unwrap(await mentio().createSegment({ body: { name, description: str(form, 'description'), filter } }));
    revalidatePath('/segments');
    redirect(`/people?segmentId=${encodeURIComponent(segment.id)}`);
  });
}
