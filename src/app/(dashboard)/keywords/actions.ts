'use server';

import type { CreateKeywordData, ReviewSource, UpdateKeywordData } from '@mentio-dev/sdk';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { bool, int, isOneOf, lines, list, str, strOrNull } from '@/lib/form';
import { REVIEW_PLATFORMS, SEARCH_PLATFORMS } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { KINDS, sourceKey, takesCountries, takesLanguage } from './shared';

type CreateBody = CreateKeywordData['body'];
type UpdateBody = NonNullable<UpdateKeywordData['body']>;
type ReviewInput = NonNullable<CreateBody['reviewSources']>[number];
type SearchPlatform = (typeof SEARCH_PLATFORMS)[number];

const countries = (form: FormData, key: string) => list(form, key).map((c) => c.toLowerCase());

/** Checked platforms; none checked = every platform (null), "reviews only" = none ([]). */
function platformsFrom(form: FormData): SearchPlatform[] | null {
  if (bool(form, 'reviewsOnly')) return [];
  const picked = form
    .getAll('platforms')
    .map(String)
    .filter((p): p is SearchPlatform => isOneOf(SEARCH_PLATFORMS, p));
  return picked.length ? picked : null;
}

function matchingFrom(form: FormData): NonNullable<CreateBody['matching']> {
  return {
    requiredTerms: list(form, 'requiredTerms'),
    requiredMode: str(form, 'requiredMode') === 'all' ? 'all' : 'any',
    excludedTerms: list(form, 'excludedTerms'),
    excludedAuthors: lines(form, 'excludedAuthors'),
    caseSensitive: bool(form, 'caseSensitive'),
  };
}

function capFrom(form: FormData): { mentions: number } | null {
  const n = int(form, 'cap');
  if (n === null) return null;
  if (n < 1) throw new Error('The monthly cap must be at least 1, or empty for none.');
  return { mentions: n };
}

/** The "connect a review page" fields, or null when left empty. */
function newSourceFrom(form: FormData): ReviewInput | null {
  const url = str(form, 'rsUrl');
  const id = str(form, 'rsId');
  const platform = str(form, 'rsPlatform');
  if (!url && !id) return null;
  const source: ReviewInput = {};
  if (url) source.url = url;
  else {
    if (!isOneOf(REVIEW_PLATFORMS, platform)) throw new Error('Pick the review platform, or paste the page link.');
    source.platform = platform;
    source.id = id;
  }
  // With a link, the platform is read from it; a picked one only decides which extra fields apply.
  const chosen = isOneOf(REVIEW_PLATFORMS, platform) ? platform : undefined;
  const cc = countries(form, 'rsCountries');
  if (cc.length && (!chosen || takesCountries(chosen))) source.countries = cc;
  const language = str(form, 'rsLanguage');
  if (language && (!chosen || takesLanguage(chosen))) source.language = language;
  return source;
}

/** A connected page as the write body takes it, with the storefront edits made in the form. */
function editedSource(form: FormData, src: ReviewSource): ReviewInput {
  const key = sourceKey(src);
  const input: ReviewInput = { platform: src.platform, id: src.id };
  if (takesCountries(src.platform)) {
    const cc = form.has(`${key}.countries`) ? countries(form, `${key}.countries`) : src.countries;
    if (cc.length) input.countries = cc;
  }
  if (takesLanguage(src.platform)) {
    const language = form.has(`${key}.language`) ? str(form, `${key}.language`) : (src.language ?? '');
    if (language) input.language = language;
  }
  return input;
}

const asInput = (src: ReviewSource): ReviewInput => ({
  platform: src.platform,
  id: src.id,
  ...(src.countries.length ? { countries: src.countries } : {}),
  ...(src.language ? { language: src.language } : {}),
});

export async function createKeywordAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const kind = str(form, 'kind');
    const platforms = platformsFrom(form);
    const source = newSourceFrom(form);
    if (platforms?.length === 0 && !source) throw new Error('A keyword searched on no platform needs a review page to collect.');
    const cap = capFrom(form);
    const context = strOrNull(form, 'context');
    const groupId = str(form, 'groupId');
    const body: CreateBody = {
      term: str(form, 'term'),
      kind: isOneOf(KINDS, kind) ? kind : 'brand',
      platforms,
      matching: matchingFrom(form),
      ...(context ? { context } : {}),
      ...(cap ? { cap } : {}),
      ...(groupId ? { groupId } : {}),
      ...(source ? { reviewSources: [source] } : {}),
    };
    const keyword = unwrap(await mentio().createKeyword({ body }));
    revalidatePath('/keywords');
    redirect(`/keywords/${keyword.id}`);
  });
}

export async function updateKeywordAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const current = unwrap(await mentio().getKeyword({ path: { id } }));
    const kind = str(form, 'kind');
    const body: UpdateBody = {
      ...(isOneOf(KINDS, kind) ? { kind } : {}),
      platforms: platformsFrom(form),
      context: strOrNull(form, 'context'),
      matching: matchingFrom(form),
      cap: capFrom(form),
    };
    const groupId = str(form, 'groupId');
    if (groupId && groupId !== current.group.id) body.groupId = groupId;

    // Review pages: send the list only when something changed, so nothing is reconnected for nothing.
    const removed = new Set(form.getAll('removeSource').map(String));
    const kept = current.reviewSources.filter((src) => !removed.has(sourceKey(src))).map((src) => editedSource(form, src));
    const added = newSourceFrom(form);
    const next = added ? [...kept, added] : kept;
    if (JSON.stringify(next) !== JSON.stringify(current.reviewSources.map(asInput))) body.reviewSources = next;

    const reviews = body.reviewSources ?? current.reviewSources;
    if (body.platforms?.length === 0 && reviews.length === 0) throw new Error('A keyword searched on no platform needs a review page to collect.');

    unwrap(await mentio().updateKeyword({ path: { id }, body }));
    revalidatePath('/keywords');
    revalidatePath(`/keywords/${id}`);
    return 'Saved';
  });
}

export async function setMutedAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const muted = bool(form, 'muted');
    unwrap(await mentio().updateKeyword({ path: { id }, body: { muted } }));
    revalidatePath('/keywords');
    revalidatePath(`/keywords/${id}`);
    return muted ? 'Paused' : 'Resumed';
  });
}

export async function deleteKeywordAction(_state: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(form, 'id');
    const result = await mentio().deleteKeyword({ path: { id } });
    if (result.error !== undefined) unwrap(result);
    revalidatePath('/keywords');
    if (bool(form, 'backToList')) redirect('/keywords');
    return 'Deleted';
  });
}
