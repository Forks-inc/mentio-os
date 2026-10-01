/**
 * An alert rule, read and written: the form fields a rule is made of, and
 * the sentence a rule reads as in the list. Shared by the pages and the
 * server actions of /alerts.
 */
import type { Alert } from '@mentio-dev/sdk';
import type { FilterDef, FilterOption } from '@/components/url-filters';
import { bool, isOneOf, list, str } from '@/lib/form';
import { INTENTS, REVIEW_PLATFORMS, SEARCH_PLATFORMS, SENTIMENTS, platformName, tagName } from '@/lib/format';

export type AlertFilter = Alert['filter'];
export type AlertSchedule = NonNullable<Alert['schedule']>;
export type AlertMode = Alert['mode'];
type Platform = NonNullable<AlertFilter['platforms']>[number];
type Sentiment = NonNullable<AlertFilter['sentiments']>[number];

export const MODES = ['instant', 'daily', 'weekly'] as const satisfies readonly AlertMode[];
export const PLATFORMS = [...SEARCH_PLATFORMS, ...REVIEW_PLATFORMS] as const satisfies readonly Platform[];
const SENTIMENT_VALUES = SENTIMENTS satisfies readonly Sentiment[];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** The relevance line the classifier draws: a rule with no floor sends from here up. */
export const RELEVANCE_LINE = 40;

export const MODE_LABELS: Record<AlertMode, string> = {
  instant: 'Instant',
  daily: 'Daily digest',
  weekly: 'Weekly digest',
};

const pad = (n: number) => String(n).padStart(2, '0');
export const timeOf = (schedule: AlertSchedule) => `${pad(schedule.hour)}:${pad(schedule.minute ?? 0)}`;

/** "Instant", "Daily at 09:00 Europe/Madrid", "Weekly on Monday at 09:00 UTC". */
export function whenText(alert: Pick<Alert, 'mode' | 'schedule'>) {
  const s = alert.schedule;
  if (alert.mode === 'instant' || !s) return 'Instant, as each mention arrives';
  const at = `at ${timeOf(s)} ${s.timezone}`;
  return alert.mode === 'weekly' ? `Weekly on ${WEEKDAYS[s.weekday ?? 1]} ${at}` : `Daily ${at}`;
}

/** The rule's filter as a few short phrases, for the list and the detail header. */
export function describeFilter(filter: AlertFilter, names: { keywords: Map<string, string>; groups: Map<string, string> }): string[] {
  const parts: string[] = [];
  const floor = filter.minRelevance;
  if (floor === undefined) parts.push('Relevant mentions');
  else if (floor < RELEVANCE_LINE) parts.push(floor === 0 ? 'Every match, noise included' : `Relevance ${floor}+, some noise included`);
  else parts.push(`Relevance ${floor}+`);
  const names_ = (ids: string[] | undefined, map: Map<string, string>) => (ids ?? []).map((id) => map.get(id) ?? id).join(', ');
  if (filter.keywordIds?.length) parts.push(`keywords ${names_(filter.keywordIds, names.keywords)}`);
  if (filter.groupIds?.length) parts.push(`groups ${names_(filter.groupIds, names.groups)}`);
  if (filter.platforms?.length) parts.push(`on ${filter.platforms.map(platformName).join(', ')}`);
  if (filter.sentiments?.length) parts.push(filter.sentiments.join(' or '));
  if (filter.intents?.length) parts.push(filter.intents.map(tagName).join(' or '));
  if (filter.minConfidence !== undefined) parts.push(`confidence ${filter.minConfidence}+`);
  if (filter.minFollowers !== undefined) parts.push(`${filter.minFollowers}+ followers`);
  if (filter.tags?.length) parts.push(`people tagged ${filter.tags.join(', ')}`);
  if (filter.linkHosts?.length) parts.push(`linking to ${filter.linkHosts.join(', ')}`);
  if (filter.languages?.length) parts.push(`in ${filter.languages.join(', ')}`);
  if (filter.automated === true) parts.push('automated posts only');
  if (filter.automated === false) parts.push('no automated posts');
  if (filter.ratings?.length) parts.push(`${filter.ratings.join(', ')} star reviews`);
  if (filter.excludeAuthors?.length) parts.push(`${filter.excludeAuthors.length} muted ${filter.excludeAuthors.length === 1 ? 'author' : 'authors'}`);
  return parts;
}

function number(form: FormData, key: string, { min, max, label, integer = true }: { min: number; max?: number; label: string; integer?: boolean }) {
  const raw = str(form, key);
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || (max !== undefined && n > max) || (integer && !Number.isInteger(n))) {
    throw new Error(`${label} must be ${integer ? 'a whole number' : 'a number'} from ${min}${max !== undefined ? ` to ${max}` : ' up'}.`);
  }
  return n;
}

/** The filter fields of the rule form. Empty fields are left out, which the API reads as "any". */
export function readFilter(form: FormData, excludeAuthors: string[]): AlertFilter {
  const filter: AlertFilter = {};
  const keywordIds = list(form, 'keywordIds');
  const groupIds = list(form, 'groupIds');
  const platforms = list(form, 'platforms').filter((p): p is Platform => isOneOf(PLATFORMS, p));
  const sentiments = list(form, 'sentiments').filter((s): s is Sentiment => isOneOf(SENTIMENT_VALUES, s));
  const intents = list(form, 'intents').filter((i) => isOneOf(INTENTS, i));
  const tags = list(form, 'tags');
  const linkHosts = list(form, 'linkHosts').map((h) => h.toLowerCase());
  const languages = list(form, 'languages').map((l) => l.toLowerCase());
  const ratings = list(form, 'ratings').map(Number).filter((r) => Number.isInteger(r) && r >= 1 && r <= 5);
  if (keywordIds.length) filter.keywordIds = keywordIds;
  if (groupIds.length) filter.groupIds = groupIds;
  if (platforms.length) filter.platforms = platforms;
  if (sentiments.length) filter.sentiments = sentiments;
  if (intents.length) filter.intents = intents;
  if (tags.length) filter.tags = tags;
  if (linkHosts.length) filter.linkHosts = linkHosts;
  if (languages.length) filter.languages = languages;
  if (ratings.length) filter.ratings = ratings;
  if (excludeAuthors.length) filter.excludeAuthors = excludeAuthors;
  const minRelevance = number(form, 'minRelevance', { min: 0, max: 100, label: 'Minimum relevance' });
  const minConfidence = number(form, 'minConfidence', { min: 0, max: 1, label: 'Minimum confidence', integer: false });
  const minFollowers = number(form, 'minFollowers', { min: 0, label: 'Minimum followers' });
  if (minRelevance !== undefined) filter.minRelevance = minRelevance;
  if (minConfidence !== undefined) filter.minConfidence = minConfidence;
  if (minFollowers !== undefined) filter.minFollowers = minFollowers;
  const automated = str(form, 'automated');
  if (automated === 'true' || automated === 'false') filter.automated = automated === 'true';
  return filter;
}

export function readMode(form: FormData): AlertMode {
  const mode = str(form, 'mode');
  return isOneOf(MODES, mode) ? mode : 'instant';
}

/** The digest schedule, or null for an instant rule. */
export function readSchedule(form: FormData, mode: AlertMode): AlertSchedule | null {
  if (mode === 'instant') return null;
  const [hour, minute] = (str(form, 'time') || '09:00').split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) throw new Error('Pick the time the digest goes out.');
  const timezone = str(form, 'timezone') || 'UTC';
  const schedule: AlertSchedule = { hour, minute, timezone, skipEmpty: bool(form, 'skipEmpty') };
  if (mode === 'weekly') schedule.weekday = number(form, 'weekday', { min: 0, max: 6, label: 'Weekday' }) ?? 1;
  return schedule;
}

/** The rule's conditions as filter chips, named like the fields readFilter takes. */
export function alertFilterDefs(keywords: FilterOption[], groups: FilterOption[]): FilterDef[] {
  const SENTIMENT_COLORS: Record<string, string> = { positive: '#10b981', neutral: '#a1a1aa', negative: '#ef4444' };
  return [
    ...(keywords.length ? [{ param: 'keywordIds', label: 'Keyword', icon: 'tag', kind: 'multi', options: keywords } as const] : []),
    ...(groups.length ? [{ param: 'groupIds', label: 'Group', icon: 'folder', kind: 'multi', options: groups } as const] : []),
    { param: 'platforms', label: 'Platform', icon: 'platform', kind: 'multi', options: PLATFORMS.map((p) => ({ value: p, label: platformName(p), platform: p })) },
    { param: 'sentiments', label: 'Sentiment', icon: 'smile', kind: 'multi', options: SENTIMENT_VALUES.map((s) => ({ value: s, label: tagName(s), dot: SENTIMENT_COLORS[s] })) },
    { param: 'intents', label: 'Intent', icon: 'target', kind: 'multi', options: INTENTS.map((i) => ({ value: i, label: tagName(i) })) },
    { param: 'ratings', label: 'Rating', icon: 'star', kind: 'multi', options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: '★'.repeat(n) })) },
    { param: 'minConfidence', label: 'Min confidence', icon: 'gauge', kind: 'text', placeholder: '0.6', operator: '≥' },
    { param: 'minFollowers', label: 'Min followers', icon: 'users', kind: 'text', placeholder: '1000', operator: '≥' },
    { param: 'automated', label: 'Automated', icon: 'bot', kind: 'single', options: [{ value: 'false', label: 'Leave them out' }, { value: 'true', label: 'Only automated' }] },
    { param: 'languages', label: 'Language', icon: 'languages', kind: 'text', placeholder: 'en, es' },
    { param: 'tags', label: 'People tag', icon: 'tags', kind: 'text', placeholder: 'customer, vip' },
    { param: 'linkHosts', label: 'Links to', icon: 'link', kind: 'text', placeholder: 'docs.example.com' },
  ];
}
