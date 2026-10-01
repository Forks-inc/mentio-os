/**
 * The audience conditions as filter chips, named like GET /v1/people's
 * parameters: the People toolbar (in the URL) and the segment editor (in a
 * form) both render these. A plain module, so server pages can build them.
 */
import type { Member, Segment } from '@mentio-dev/sdk';
import type { FilterDef } from '@/components/url-filters';
import { INTENT_OPTIONS, KIND_OPTIONS, PLATFORM_OPTIONS, STAGE_OPTIONS } from './filters';

const pairs = (options: ReadonlyArray<readonly [string, string]>) => options.map(([value, label]) => ({ value, label }));
const yesNo = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];

/** Every condition a segment can hold. */
export function audienceFilterDefs(members: Member[]): FilterDef[] {
  return [
    { param: 'platforms', notParam: 'notPlatforms', label: 'Platform', icon: 'platform', kind: 'multi', options: PLATFORM_OPTIONS.map(([value, label]) => ({ value, label, platform: value })) },
    { param: 'stages', label: 'Stage', icon: 'flag', kind: 'multi', options: pairs(STAGE_OPTIONS) },
    { param: 'ownerIds', label: 'Owner', icon: 'user', kind: 'multi', options: [{ value: 'none', label: 'Nobody' }, ...members.map((m) => ({ value: m.userId, label: m.name ?? m.email }))] },
    { param: 'intents', notParam: 'notIntents', label: 'Intent', icon: 'target', kind: 'multi', options: pairs(INTENT_OPTIONS) },
    { param: 'keywordKinds', label: 'Mentioned', icon: 'tag', kind: 'multi', options: pairs(KIND_OPTIONS) },
    { param: 'neverKeywordKinds', label: 'Never mentioned', icon: 'tag', kind: 'multi', options: pairs(KIND_OPTIONS) },
    { param: 'tags', notParam: 'notTags', label: 'Tag', icon: 'tags', kind: 'text', placeholder: 'lead, investor' },
    { param: 'linkHosts', label: 'Links to', icon: 'link', kind: 'text', placeholder: 'docs.example.com' },
    { param: 'minFollowers', label: 'Min followers', icon: 'users', kind: 'text', placeholder: '1000', operator: '≥' },
    { param: 'maxFollowers', label: 'Max followers', icon: 'users', kind: 'text', placeholder: '100000', operator: '≤' },
    { param: 'minMentions', label: 'Mentions', icon: 'hash', kind: 'text', placeholder: '3', operator: '≥' },
    { param: 'minNegative', label: 'Negative mentions', icon: 'smile', kind: 'text', placeholder: '1', operator: '≥' },
    { param: 'newSinceDays', label: 'New in the last', icon: 'calendar', kind: 'text', placeholder: 'days' },
    { param: 'muted', label: 'Muted', icon: 'muted', kind: 'single', options: yesNo },
    { param: 'automated', label: 'Bot account', icon: 'bot', kind: 'single', options: yesNo },
  ];
}

/** The People list: a segment as its base, every audience condition, and when someone was first seen. */
export function peopleFilterDefs(members: Member[], segments: Segment[]): FilterDef[] {
  return [
    ...(segments.length ? [{ param: 'segmentId', label: 'Segment', icon: 'users', kind: 'single', options: segments.map((s) => ({ value: s.id, label: `${s.name} (${s.count})` })) } as const] : []),
    ...audienceFilterDefs(members),
    { param: 'since', label: 'First seen', icon: 'calendar', kind: 'dates', untilParam: null },
  ];
}
