/**
 * The analytics window in the URL: a preset range or a from/to pair, plus
 * optional keyword and platform filters. Every report takes the same query.
 */
import type { GetAnalyticsSummaryData, GroupRef } from '@mentio-dev/sdk';
import { isOneOf } from '@/lib/form';
import { PLATFORM_NAMES } from '@/lib/format';
import { many, one, type SearchParams } from '@/lib/params';

export type WindowQuery = NonNullable<GetAnalyticsSummaryData['query']>;
type Platform = NonNullable<WindowQuery['platforms']>[number];

export const RANGES = ['7d', '30d', '90d', '365d'] as const;
export const TABS = ['overview', 'breakdowns', 'voice', 'reviews'] as const;
export type Tab = (typeof TABS)[number];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const PLATFORMS = Object.keys(PLATFORM_NAMES) as Platform[];

export function readWindow(params: SearchParams) {
  const range = one(params, 'range');
  const from = one(params, 'from');
  const to = one(params, 'to');
  const custom = (from && DAY.test(from)) || (to && DAY.test(to));
  const keywordIds = many(params, 'keywordIds');
  const platforms = many(params, 'platforms').filter((p): p is Platform => isOneOf(PLATFORMS, p));
  const query: WindowQuery = {
    ...(custom
      ? { ...(from && DAY.test(from) ? { from } : {}), ...(to && DAY.test(to) ? { to } : {}) }
      : { range: isOneOf(RANGES, range) ? range : '30d' }),
    ...(keywordIds.length ? { keywordIds } : {}),
    ...(platforms.length ? { platforms } : {}),
  };
  const tab = one(params, 'tab');
  return { query, tab: (isOneOf(TABS, tab) ? tab : 'overview') as Tab, range: custom ? '' : (query.range ?? '30d') };
}

/** A link into the mentions feed for the same window and filters, plus `extra`. */
export function mentionsHref(window: { from: string; to: string }, query: WindowQuery, extra: Record<string, string>) {
  const params = new URLSearchParams();
  // The report's window is cut in UTC (no timezone is sent), so the feed gets the same instants.
  params.set('since', `${window.from.slice(0, 10)}T00:00:00.000Z`);
  params.set('until', `${window.to.slice(0, 10)}T23:59:59.999Z`);
  if (query.keywordIds?.length) params.set('keywordIds', query.keywordIds.join(','));
  if (query.platforms?.length) params.set('platforms', query.platforms.join(','));
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  return `/mentions?${params}`;
}

/** How a keyword is named everywhere: the term alone in the default group, "term (Group)" elsewhere. */
export const keywordName = (keyword: { term: string; group?: GroupRef | null }) =>
  keyword.group && !keyword.group.isDefault ? `${keyword.term} (${keyword.group.name})` : keyword.term;

/** "2026-09-01" -> "Sep 1"; an hour bucket keeps its hour. */
export function pointLabel(date: string) {
  const [day, hour] = date.split('T');
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  const text = new Intl.DateTimeFormat('es-MX', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d);
  return hour ? `${text} ${hour.slice(0, 5)}` : text;
}

/** Change against the previous window, as a signed percentage; null when there is nothing to compare. */
export function change(current: number, previous: number | null | undefined) {
  if (previous === null || previous === undefined) return null;
  if (previous === 0) return current === 0 ? 0 : Infinity;
  return ((current - previous) / previous) * 100;
}
