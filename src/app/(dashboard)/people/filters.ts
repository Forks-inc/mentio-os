/**
 * The audience filter vocabulary, shared by the people list, its CSV export,
 * "save as segment" and the segment editor. A filter lives in the URL with
 * the API's own parameter names, so a segment and a people link are the same
 * thing written two ways.
 */
import type { ListPeopleData, Segment } from '@mentio-dev/sdk';
import { INTENTS, PLATFORM_NAMES, tagName } from '@/lib/format';
import { isOneOf } from '@/lib/form';
import { many, one, type SearchParams } from '@/lib/params';

export type PeopleQuery = NonNullable<ListPeopleData['query']>;
export type AudienceFilter = Segment['filter'];
type Platform = NonNullable<AudienceFilter['platforms']>[number];
type Stage = NonNullable<AudienceFilter['stages']>[number];
type KeywordKind = NonNullable<AudienceFilter['keywordKinds']>[number];

export const PLATFORMS = Object.keys(PLATFORM_NAMES) as Platform[];
export const STAGES: readonly Stage[] = ['not_contacted', 'contacted', 'replied', 'in_talks', 'customer', 'not_a_fit'];
export const KEYWORD_KINDS: readonly KeywordKind[] = ['brand', 'competitor', 'topic'];
export const SORTS = ['mentions', 'recent', 'reach', 'new'] as const;
export const SORT_LABELS: Record<(typeof SORTS)[number], string> = {
  mentions: 'Most mentions',
  recent: 'Last seen',
  reach: 'Most followers',
  new: 'First seen',
};

export const stageName = (stage: string) => tagName(stage);
export const PLATFORM_OPTIONS = PLATFORMS.map((p) => [p, PLATFORM_NAMES[p] ?? p] as const);
export const STAGE_OPTIONS = STAGES.map((s) => [s, stageName(s)] as const);
export const INTENT_OPTIONS = INTENTS.map((i) => [i, tagName(i)] as const);
export const KIND_OPTIONS = KEYWORD_KINDS.map((k) => [k, tagName(k)] as const);

const pickAll = <T extends string>(options: readonly T[], values: string[]) => values.filter((v): v is T => isOneOf(options, v));

function count(params: SearchParams, key: string, min: number, max = Number.MAX_SAFE_INTEGER) {
  const raw = one(params, key);
  if (!raw) return undefined;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

function flag(params: SearchParams, key: string) {
  const raw = one(params, key);
  return raw === 'true' ? true : raw === 'false' ? false : undefined;
}

/** Only the keys with a value, so an empty filter stays `{}`. */
function compactObject<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)),
  ) as T;
}

/** The part of the URL a segment can hold (every condition of Segment['filter']). */
export function audienceFilter(params: SearchParams): AudienceFilter {
  return compactObject<AudienceFilter>({
    platforms: pickAll(PLATFORMS, many(params, 'platforms')),
    notPlatforms: pickAll(PLATFORMS, many(params, 'notPlatforms')),
    tags: many(params, 'tags').map((t) => t.trim()).filter(Boolean),
    notTags: many(params, 'notTags').map((t) => t.trim()).filter(Boolean),
    intents: many(params, 'intents'),
    notIntents: many(params, 'notIntents'),
    keywordKinds: pickAll(KEYWORD_KINDS, many(params, 'keywordKinds')),
    neverKeywordKinds: pickAll(KEYWORD_KINDS, many(params, 'neverKeywordKinds')),
    stages: pickAll(STAGES, many(params, 'stages')),
    ownerIds: many(params, 'ownerIds'),
    linkHosts: many(params, 'linkHosts').map((h) => h.trim()).filter(Boolean),
    minFollowers: count(params, 'minFollowers', 0),
    maxFollowers: count(params, 'maxFollowers', 0),
    minMentions: count(params, 'minMentions', 1),
    minNegative: count(params, 'minNegative', 1),
    newSinceDays: count(params, 'newSinceDays', 1, 365),
    muted: flag(params, 'muted'),
    automated: flag(params, 'automated'),
  });
}

/** Everything GET /v1/people takes, read from the URL. */
export function peopleQuery(params: SearchParams, page?: { limit: number; offset: number }): PeopleQuery {
  const since = one(params, 'since');
  const sort = one(params, 'sort');
  return compactObject<PeopleQuery>({
    ...audienceFilter(params),
    q: one(params, 'q'),
    segmentId: one(params, 'segmentId'),
    since: since && !Number.isNaN(Date.parse(since)) ? new Date(since).toISOString() : undefined,
    sort: isOneOf(SORTS, sort) ? sort : undefined,
    ...(page ?? {}),
  });
}

/** A filter written back as URL params (for "open in People" links). */
export function filterToSearch(filter: AudienceFilter): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(','));
    } else query.set(key, String(value));
  }
  return query.toString();
}

/** A submitted form read as URL params, so forms and links share one parser. */
export function formToParams(form: FormData): SearchParams {
  const params: Record<string, string[]> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string' || key.startsWith('$')) continue;
    const parts = value.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
    (params[key] ??= []).push(...parts);
  }
  return params;
}

/** One line per condition, for showing what a segment means. */
export function describeFilter(filter: AudienceFilter, members: Map<string, string> = new Map()): string[] {
  const names = (list: string[] | undefined, label: (v: string) => string = (v) => v) => (list ?? []).map(label).join(', ');
  const out: string[] = [];
  if (filter.platforms?.length) out.push(`On ${names(filter.platforms, (p) => PLATFORM_NAMES[p] ?? p)}`);
  if (filter.notPlatforms?.length) out.push(`Not on ${names(filter.notPlatforms, (p) => PLATFORM_NAMES[p] ?? p)}`);
  if (filter.tags?.length) out.push(`Tagged ${names(filter.tags)}`);
  if (filter.notTags?.length) out.push(`Not tagged ${names(filter.notTags)}`);
  if (filter.intents?.length) out.push(`Intent ${names(filter.intents, tagName)}`);
  if (filter.notIntents?.length) out.push(`No intent ${names(filter.notIntents, tagName)}`);
  if (filter.keywordKinds?.length) out.push(`Mentioned a ${names(filter.keywordKinds)} keyword`);
  if (filter.neverKeywordKinds?.length) out.push(`Never mentioned a ${names(filter.neverKeywordKinds)} keyword`);
  if (filter.stages?.length) out.push(`Stage ${names(filter.stages, stageName)}`);
  if (filter.ownerIds?.length) out.push(`Owner ${names(filter.ownerIds, (id) => (id === 'none' ? 'nobody' : members.get(id) ?? id))}`);
  if (filter.linkHosts?.length) out.push(`Links to ${names(filter.linkHosts)}`);
  if (filter.minFollowers !== undefined) out.push(`At least ${filter.minFollowers} followers`);
  if (filter.maxFollowers !== undefined) out.push(`At most ${filter.maxFollowers} followers`);
  if (filter.minMentions !== undefined) out.push(`At least ${filter.minMentions} mentions`);
  if (filter.minNegative !== undefined) out.push(`At least ${filter.minNegative} negative mentions`);
  if (filter.newSinceDays !== undefined) out.push(`First seen in the last ${filter.newSinceDays} days`);
  if (filter.muted !== undefined) out.push(filter.muted ? 'Muted' : 'Not muted');
  if (filter.automated !== undefined) out.push(filter.automated ? 'Bots' : 'Not bots');
  return out;
}
