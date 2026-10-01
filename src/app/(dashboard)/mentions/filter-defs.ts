/**
 * The mention conditions as filter chips, named like GET /v1/mentions's
 * parameters: the feed's toolbar (in the URL) and the view editor (in a form)
 * both render these. A plain module, so server pages can build them.
 */
import type { FilterDef, FilterOption } from '@/components/url-filters';
import { INTENTS, PLATFORM_NAMES, SENTIMENTS, tagName } from '@/lib/format';

const SENTIMENT_COLORS: Record<string, string> = { positive: '#10b981', neutral: '#a1a1aa', negative: '#ef4444' };

export function mentionFilterDefs(
  keywords: FilterOption[],
  groups: FilterOption[],
  /** `window`: the feed's date chip (a view holds no window); `person`/`alert`: shown when a link set them. */
  extra: { window?: boolean; person?: boolean; alert?: boolean } = {},
): FilterDef[] {
  return [
    ...(keywords.length ? [{ param: 'keywordIds', notParam: 'notKeywordIds', label: 'Keyword', icon: 'tag', kind: 'multi', options: keywords } as const] : []),
    { param: 'keywordKinds', label: 'Keyword kind', icon: 'tags', kind: 'multi', options: ['brand', 'competitor', 'topic'].map((k) => ({ value: k, label: tagName(k) })) },
    ...(groups.length ? [{ param: 'groupIds', label: 'Group', icon: 'folder', kind: 'multi', options: groups } as const] : []),
    { param: 'platforms', notParam: 'notPlatforms', label: 'Platform', icon: 'platform', kind: 'multi', options: Object.entries(PLATFORM_NAMES).map(([value, label]) => ({ value, label, platform: value })) },
    { param: 'sentiments', notParam: 'notSentiments', label: 'Sentiment', icon: 'smile', kind: 'multi', options: SENTIMENTS.map((s) => ({ value: s, label: tagName(s), dot: SENTIMENT_COLORS[s] })) },
    { param: 'intents', notParam: 'notIntents', label: 'Intent', icon: 'target', kind: 'multi', options: INTENTS.map((i) => ({ value: i, label: tagName(i) })) },
    { param: 'status', label: 'Status', icon: 'status', kind: 'single', options: [{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }, { value: 'ignored', label: 'Ignored' }] },
    { param: 'relevant', label: 'Relevance', icon: 'sparkles', kind: 'single', options: [{ value: 'true', label: 'Relevant' }, { value: 'false', label: 'Not relevant' }] },
    { param: 'minRelevance', label: 'Min relevance', icon: 'gauge', kind: 'text', placeholder: '0 to 100', operator: '≥' },
    { param: 'minConfidence', label: 'Min confidence', icon: 'gauge', kind: 'text', placeholder: '0.6', operator: '≥' },
    { param: 'isReply', label: 'Type', icon: 'reply', kind: 'single', options: [{ value: 'false', label: 'Posts' }, { value: 'true', label: 'Replies' }] },
    { param: 'automated', label: 'Automated', icon: 'bot', kind: 'single', options: [{ value: 'false', label: 'Human' }, { value: 'true', label: 'Automated' }] },
    { param: 'ratings', label: 'Rating', icon: 'star', kind: 'multi', options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: '★'.repeat(n) })) },
    { param: 'minFollowers', label: 'Min followers', icon: 'users', kind: 'text', placeholder: '1000', operator: '≥' },
    { param: 'maxFollowers', label: 'Max followers', icon: 'users', kind: 'text', placeholder: '100000', operator: '≤' },
    { param: 'languages', label: 'Language', icon: 'languages', kind: 'text', placeholder: 'en, es' },
    { param: 'linkHosts', label: 'Links to', icon: 'link', kind: 'text', placeholder: 'acme.com, docs.acme.com' },
    ...(extra.window ? [{ param: 'since', label: 'Published', icon: 'calendar', kind: 'dates' } as const] : []),
    ...(extra.person ? [{ param: 'personId', label: 'Author', icon: 'user', kind: 'fixed', value: 'One person' } as const] : []),
    ...(extra.alert ? [{ param: 'alertId', label: 'Alert rule', icon: 'bell', kind: 'fixed', value: 'What the rule sends' } as const] : []),
  ];
}
