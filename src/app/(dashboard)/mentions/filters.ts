/**
 * The mention filter vocabulary, in one place. The feed reads it from the URL,
 * the "Save as view" and view editor forms read it from a submitted form, and
 * both turn it into what the API takes: a search query or a view's filter.
 * Field names are the API's own (keywordIds, platforms, ...), so a URL of this
 * app reads like a call to GET /v1/mentions.
 */
import type { SearchMentionsData, View } from '@mentio-dev/sdk';
import { INTENTS, PLATFORM_NAMES, SENTIMENTS } from '@/lib/format';
import { isOneOf } from '@/lib/form';

export type SearchQuery = NonNullable<SearchMentionsData['query']>;
export type ViewFilter = View['filter'];
export type Platform = NonNullable<ViewFilter['platforms']>[number];
export type Sentiment = NonNullable<ViewFilter['sentiments']>[number];
export type KeywordKind = NonNullable<ViewFilter['keywordKinds']>[number];
export type Status = NonNullable<ViewFilter['status']>;

export const PLATFORMS = Object.keys(PLATFORM_NAMES) as Platform[];
export const STATUSES = ['open', 'done', 'ignored'] as const satisfies readonly Status[];
export const KEYWORD_KINDS = ['brand', 'competitor', 'topic'] as const satisfies readonly KeywordKind[];
export const SORTS = ['newest', 'priority'] as const;
export { INTENTS, SENTIMENTS };

/**
 * Everything a filter can say, normalized. Booleans are tri-state (undefined
 * means "either"); lists are any-of, `not*` lists none-of.
 */
export type FilterValues = {
  q?: string;
  keywordIds: string[];
  notKeywordIds: string[];
  keywordKinds: KeywordKind[];
  groupIds: string[];
  platforms: Platform[];
  notPlatforms: Platform[];
  sentiments: Sentiment[];
  notSentiments: Sentiment[];
  intents: string[];
  notIntents: string[];
  languages: string[];
  linkHosts: string[];
  excludeAuthors: string[];
  ratings: number[];
  status?: Status;
  relevant?: boolean;
  isReply?: boolean;
  automated?: boolean;
  minRelevance?: number;
  minConfidence?: number;
  minFollowers?: number;
  maxFollowers?: number;
  /** Feed only: views carry no window, no order, no person and no alert rule. */
  personId?: string;
  /** An alert rule's whole filter, with delivery's gates (relevant, not ignored). */
  alertId?: string;
  since?: string;
  until?: string;
  sort?: (typeof SORTS)[number];
};

/** Reads every value of a key: repeated params, or one comma/newline separated value. */
export type Getter = (key: string) => string[];

export function getterFromParams(params: Record<string, string | string[] | undefined>): Getter {
  return (key) => {
    const value = params[key];
    return (Array.isArray(value) ? value : value ? [value] : []).flatMap(splitFor(key));
  };
}

export function getterFromForm(form: FormData): Getter {
  return (key) => form.getAll(key).flatMap((v) => splitFor(key)(String(v)));
}

const splitList = (value: string) => value.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
const splitLines = (value: string) => value.split('\n').map((v) => v.trim()).filter(Boolean);
/** Author entries are names ("Doe, John"), so they split on lines only. */
const splitFor = (key: string) => (key === 'excludeAuthors' ? splitLines : splitList);

const oneOfList = <T extends string>(options: readonly T[], values: string[]) => [...new Set(values.filter((v): v is T => isOneOf(options, v)))];

function triState(get: Getter, key: string) {
  const value = get(key)[0];
  return value === 'true' ? true : value === 'false' ? false : undefined;
}

function number(get: Getter, key: string, min: number, max: number) {
  const raw = get(key)[0];
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseFilters(get: Getter): FilterValues {
  const q = get('q').join(' ').trim();
  const status = get('status')[0];
  const sort = get('sort')[0];
  const since = get('since')[0];
  const until = get('until')[0];
  const minRelevance = number(get, 'minRelevance', 0, 100);
  const minFollowers = number(get, 'minFollowers', 0, Number.MAX_SAFE_INTEGER);
  const maxFollowers = number(get, 'maxFollowers', 0, Number.MAX_SAFE_INTEGER);
  return {
    q: q || undefined,
    keywordIds: [...new Set(get('keywordIds'))],
    notKeywordIds: [...new Set(get('notKeywordIds'))],
    keywordKinds: oneOfList(KEYWORD_KINDS, get('keywordKinds')),
    groupIds: [...new Set(get('groupIds'))],
    platforms: oneOfList(PLATFORMS, get('platforms')),
    notPlatforms: oneOfList(PLATFORMS, get('notPlatforms')),
    sentiments: oneOfList(SENTIMENTS, get('sentiments')),
    notSentiments: oneOfList(SENTIMENTS, get('notSentiments')),
    intents: [...new Set(get('intents'))],
    notIntents: [...new Set(get('notIntents'))],
    languages: [...new Set(get('languages').map((l) => l.toLowerCase()).filter((l) => /^[a-z]{2}$/.test(l)))],
    linkHosts: [...new Set(get('linkHosts'))],
    excludeAuthors: [...new Set(get('excludeAuthors'))],
    ratings: [...new Set(get('ratings').map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5))],
    status: isOneOf(STATUSES, status) ? status : undefined,
    relevant: triState(get, 'relevant'),
    isReply: triState(get, 'isReply'),
    automated: triState(get, 'automated'),
    minRelevance: minRelevance === undefined ? undefined : Math.round(minRelevance),
    minConfidence: number(get, 'minConfidence', 0, 1),
    minFollowers: minFollowers === undefined ? undefined : Math.round(minFollowers),
    maxFollowers: maxFollowers === undefined ? undefined : Math.round(maxFollowers),
    personId: get('personId')[0] || undefined,
    alertId: get('alertId')[0] || undefined,
    since: since && DAY.test(since) ? since : undefined,
    until: until && DAY.test(until) ? until : undefined,
    sort: isOneOf(SORTS, sort) ? sort : undefined,
  };
}

/** Lists become undefined when empty, so a query or a filter never carries `[]`. */
const nonEmpty = <T>(list: T[]) => (list.length ? list : undefined);

function strip<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/** A view's filter: no window, no sort (the API refuses neither, it just has no such fields). */
export function toViewFilter(f: FilterValues): ViewFilter {
  return strip<ViewFilter>({
    q: f.q,
    keywordIds: nonEmpty(f.keywordIds),
    notKeywordIds: nonEmpty(f.notKeywordIds),
    keywordKinds: nonEmpty(f.keywordKinds),
    groupIds: nonEmpty(f.groupIds),
    platforms: nonEmpty(f.platforms),
    notPlatforms: nonEmpty(f.notPlatforms),
    sentiments: nonEmpty(f.sentiments),
    notSentiments: nonEmpty(f.notSentiments),
    intents: nonEmpty(f.intents),
    notIntents: nonEmpty(f.notIntents),
    languages: nonEmpty(f.languages),
    linkHosts: nonEmpty(f.linkHosts),
    excludeAuthors: nonEmpty(f.excludeAuthors),
    ratings: nonEmpty(f.ratings),
    status: f.status,
    relevant: f.relevant,
    isReply: f.isReply,
    automated: f.automated,
    minRelevance: f.minRelevance,
    minConfidence: f.minConfidence,
    minFollowers: f.minFollowers,
    maxFollowers: f.maxFollowers,
  });
}

/** The search query for GET /v1/mentions and its CSV export. */
export function toSearchQuery(f: FilterValues, extra: { viewId?: string; cursor?: string; limit?: number } = {}): SearchQuery {
  return strip<SearchQuery>({
    ...toViewFilter(f),
    since: f.since ? `${f.since}T00:00:00.000Z` : undefined,
    until: f.until ? `${f.until}T23:59:59.999Z` : undefined,
    sort: f.sort,
    personId: f.personId,
    alertId: f.alertId,
    viewId: extra.viewId,
    cursor: extra.cursor,
    limit: extra.limit,
  });
}

export function fromViewFilter(filter: ViewFilter): FilterValues {
  return parseFilters((key) => {
    const value: unknown = (filter as Record<string, unknown>)[key];
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value.map(String) : [String(value)];
  });
}

/** The URL params of a filter, for links like "open this view's mentions" or a pager. */
export function toParams(f: FilterValues): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(f)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) out.push([key, String(v)]);
  }
  return out;
}

/**
 * A view saved from a page that already applies a view: the page's filters
 * narrow the base, so the new view is both ANDed. Any-of lists intersect,
 * none-of lists add up, floors take the higher one, the rest the page's.
 */
export function narrow(base: FilterValues, page: FilterValues): FilterValues {
  const anyOf = <T>(a: T[], b: T[]) => (a.length && b.length ? a.filter((v) => b.includes(v)) : a.length ? a : b);
  const noneOf = <T>(a: T[], b: T[]) => [...new Set([...a, ...b])];
  const floor = (a?: number, b?: number) => (a === undefined ? b : b === undefined ? a : Math.max(a, b));
  const ceiling = (a?: number, b?: number) => (a === undefined ? b : b === undefined ? a : Math.min(a, b));
  return {
    ...base,
    ...strip(page),
    q: page.q ?? base.q,
    keywordIds: anyOf(base.keywordIds, page.keywordIds),
    notKeywordIds: noneOf(base.notKeywordIds, page.notKeywordIds),
    keywordKinds: anyOf(base.keywordKinds, page.keywordKinds),
    groupIds: anyOf(base.groupIds, page.groupIds),
    platforms: anyOf(base.platforms, page.platforms),
    notPlatforms: noneOf(base.notPlatforms, page.notPlatforms),
    sentiments: anyOf(base.sentiments, page.sentiments),
    notSentiments: noneOf(base.notSentiments, page.notSentiments),
    intents: anyOf(base.intents, page.intents),
    notIntents: noneOf(base.notIntents, page.notIntents),
    languages: anyOf(base.languages, page.languages),
    linkHosts: anyOf(base.linkHosts, page.linkHosts),
    excludeAuthors: noneOf(base.excludeAuthors, page.excludeAuthors),
    ratings: anyOf(base.ratings, page.ratings),
    minRelevance: floor(base.minRelevance, page.minRelevance),
    minConfidence: floor(base.minConfidence, page.minConfidence),
    minFollowers: floor(base.minFollowers, page.minFollowers),
    maxFollowers: ceiling(base.maxFollowers, page.maxFollowers),
  };
}

/** How many conditions a filter holds, for "3 filters" labels. */
export function countConditions(f: ViewFilter) {
  return Object.values(f).filter((v) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)).length;
}

/** A filter in words, one phrase per condition: "Platform is X or Reddit", "Relevance at least 60". */
export function describeFilter(f: FilterValues, names: { keywords: Map<string, string>; groups: Map<string, string> }): string[] {
  const or = (items: string[]) => (items.length <= 2 ? items.join(' or ') : `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`);
  const nor = (items: string[]) => items.join(', ');
  const keyword = (id: string) => names.keywords.get(id) ?? id;
  const group = (id: string) => names.groups.get(id) ?? id;
  const platform = (id: string) => PLATFORM_NAMES[id] ?? id;
  const tag = (t: string) => ({
    positive: 'positivo', neutral: 'neutral', negative: 'negativo',
    brand: 'candidato', competitor: 'adversario', topic: 'tema',
    open: 'abierto', done: 'resuelto', ignored: 'ignorado',
    buy_intent: 'intención de apoyo', question: 'pregunta', complaint: 'queja', praise: 'reconocimiento',
    comparison: 'comparación', churn_intent: 'intención de cambio', bug_report: 'reporte de error',
    pricing: 'costo', hiring: 'contratación', event: 'evento', promotional: 'promoción',
  } as Record<string, string>)[t] ?? t.replace(/_/g, ' ');
  const yesNo = (value: boolean | undefined, yes: string, no: string) => (value === undefined ? [] : [value ? yes : no]);
  const out: string[] = [];
  if (f.q) out.push(`El texto contiene "${f.q}"`);
  if (f.personId) out.push('Una persona');
  if (f.alertId) out.push('Contenido que envía una regla de alerta');
  if (f.keywordIds.length) out.push(`Término monitoreado: ${or(f.keywordIds.map(keyword))}`);
  if (f.notKeywordIds.length) out.push(`Término monitoreado distinto de ${nor(f.notKeywordIds.map(keyword))}`);
  if (f.keywordKinds.length) out.push(`Tipo de término: ${or(f.keywordKinds.map(tag))}`);
  if (f.groupIds.length) out.push(`Campaña: ${or(f.groupIds.map(group))}`);
  if (f.platforms.length) out.push(`Canal: ${or(f.platforms.map(platform))}`);
  if (f.notPlatforms.length) out.push(`Canal distinto de ${nor(f.notPlatforms.map(platform))}`);
  if (f.sentiments.length) out.push(`Sentimiento: ${or(f.sentiments.map(tag))}`);
  if (f.notSentiments.length) out.push(`Sentimiento distinto de ${nor(f.notSentiments.map(tag))}`);
  if (f.intents.length) out.push(`Intención: ${or(f.intents.map(tag))}`);
  if (f.notIntents.length) out.push(`Intención distinta de ${nor(f.notIntents.map(tag))}`);
  if (f.status) out.push(`Estado: ${tag(f.status)}`);
  out.push(...yesNo(f.relevant, 'Solo relevantes', 'Solo no relevantes'));
  if (f.minRelevance !== undefined) out.push(`Relevancia de al menos ${f.minRelevance}`);
  if (f.minConfidence !== undefined) out.push(`Confianza de al menos ${Math.round(f.minConfidence * 100)}%`);
  out.push(...yesNo(f.isReply, 'Solo respuestas', 'Solo publicaciones principales'));
  out.push(...yesNo(f.automated, 'Solo automatizadas', 'Sin publicaciones automatizadas'));
  if (f.languages.length) out.push(`Idioma: ${or(f.languages)}`);
  if (f.linkHosts.length) out.push(`Enlaces a ${or(f.linkHosts)}`);
  if (f.excludeAuthors.length) out.push(`${f.excludeAuthors.length === 1 ? 'Oculta' : 'Oculta'} ${f.excludeAuthors.length} ${f.excludeAuthors.length === 1 ? 'autor' : 'autores'}`);
  if (f.ratings.length) out.push(`Calificación de ${or(f.ratings.map(String))} estrellas`);
  if (f.minFollowers !== undefined) out.push(`Al menos ${f.minFollowers} seguidores`);
  if (f.maxFollowers !== undefined) out.push(`Como máximo ${f.maxFollowers} seguidores`);
  if (f.since) out.push(`Desde ${f.since}`);
  if (f.until) out.push(`Hasta ${f.until}`);
  return out;
}
