/**
 * The audience conditions as filter chips, named like GET /v1/people's
 * parameters: the People toolbar (in the URL) and the segment editor (in a
 * form) both render these. A plain module, so server pages can build them.
 */
import type { Member, Segment } from '@mentio-dev/sdk';
import type { FilterDef } from '@/components/url-filters';
import { INTENT_OPTIONS, KIND_OPTIONS, PLATFORM_OPTIONS, STAGE_OPTIONS } from './filters';

const pairs = (options: ReadonlyArray<readonly [string, string]>) => options.map(([value, label]) => ({ value, label }));
const yesNo = [{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }];

/** Every condition a segment can hold. */
export function audienceFilterDefs(members: Member[]): FilterDef[] {
  return [
    { param: 'platforms', notParam: 'notPlatforms', label: 'Canal', icon: 'platform', kind: 'multi', options: PLATFORM_OPTIONS.map(([value, label]) => ({ value, label, platform: value })) },
    { param: 'stages', label: 'Etapa de contacto', icon: 'flag', kind: 'multi', options: pairs(STAGE_OPTIONS) },
    { param: 'ownerIds', label: 'Responsable', icon: 'user', kind: 'multi', options: [{ value: 'none', label: 'Sin responsable' }, ...members.map((m) => ({ value: m.userId, label: m.name ?? m.email }))] },
    { param: 'intents', notParam: 'notIntents', label: 'Intención', icon: 'target', kind: 'multi', options: pairs(INTENT_OPTIONS) },
    { param: 'keywordKinds', label: 'Mencionó un término de', icon: 'tag', kind: 'multi', options: pairs(KIND_OPTIONS) },
    { param: 'neverKeywordKinds', label: 'No mencionó un término de', icon: 'tag', kind: 'multi', options: pairs(KIND_OPTIONS) },
    { param: 'tags', notParam: 'notTags', label: 'Etiquetas', icon: 'tags', kind: 'text', placeholder: 'movilidad, seguridad' },
    { param: 'linkHosts', label: 'Enlaces a', icon: 'link', kind: 'text', placeholder: 'campana.mx' },
    { param: 'minFollowers', label: 'Seguidores mínimos', icon: 'users', kind: 'text', placeholder: '1000', operator: '≥' },
    { param: 'maxFollowers', label: 'Seguidores máximos', icon: 'users', kind: 'text', placeholder: '100000', operator: '≤' },
    { param: 'minMentions', label: 'Menciones', icon: 'hash', kind: 'text', placeholder: '3', operator: '≥' },
    { param: 'minNegative', label: 'Menciones negativas', icon: 'smile', kind: 'text', placeholder: '1', operator: '≥' },
    { param: 'newSinceDays', label: 'Actividad en los últimos', icon: 'calendar', kind: 'text', placeholder: 'días' },
    { param: 'muted', label: 'Autor silenciado', icon: 'muted', kind: 'single', options: yesNo },
    { param: 'automated', label: 'Cuenta automatizada', icon: 'bot', kind: 'single', options: yesNo },
  ];
}

/** The People list: a segment as its base, every audience condition, and when someone was first seen. */
export function peopleFilterDefs(members: Member[], segments: Segment[]): FilterDef[] {
  return [
    ...(segments.length ? [{ param: 'segmentId', label: 'Segmento', icon: 'users', kind: 'single', options: segments.map((s) => ({ value: s.id, label: `${s.name} (${s.count})` })) } as const] : []),
    ...audienceFilterDefs(members),
    { param: 'since', label: 'Primera actividad', icon: 'calendar', kind: 'dates', untilParam: null },
  ];
}
