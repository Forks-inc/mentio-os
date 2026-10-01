'use server';

import { revalidatePath } from 'next/cache';
import { run, type ActionState } from '@/lib/action';
import { lines, list } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';

/** Every list is sent whole: what the form shows is what the workspace gets. */
export async function updateFiltersAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    unwrap(
      await mentio().updateFilters({
        body: {
          excludedTerms: list(form, 'excludedTerms'),
          excludedAuthors: lines(form, 'excludedAuthors'),
          excludedRepos: list(form, 'excludedRepos'),
          subreddits: { only: list(form, 'subredditsOnly'), excluded: list(form, 'subredditsExcluded') },
        },
      }),
    );
    revalidatePath('/settings/filters');
    return 'Saved. The rules apply from the next poll.';
  });
}
