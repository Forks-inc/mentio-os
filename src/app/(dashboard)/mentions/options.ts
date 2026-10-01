/** The choices the filter forms offer: the workspace's keywords and groups. Server only. */
import { mentio, unwrap } from '@/lib/mentio';

export type FilterOptions = {
  keywords: Array<readonly [string, string]>;
  /** Empty while the workspace has one group: groups only matter once there are two. */
  groups: Array<readonly [string, string]>;
  names: { keywords: Map<string, string>; groups: Map<string, string> };
};

export async function loadFilterOptions(): Promise<FilterOptions> {
  const api = mentio();
  const [keywords, groups] = await Promise.all([
    api.listKeywords({ query: { sort: 'term' } }).then(unwrap),
    api.listGroups().then(unwrap),
  ]);
  const multiGroup = groups.data.length > 1;
  // A term can be tracked once per group, so outside the default group the name carries it.
  const keywordLabel = (k: (typeof keywords.data)[number]) => (multiGroup && !k.group.isDefault ? `${k.term} (${k.group.name})` : k.term);
  const keywordOptions = keywords.data.map((k) => [k.id, keywordLabel(k)] as const);
  const groupOptions = groups.data.map((g) => [g.id, g.name] as const);
  return {
    keywords: keywordOptions,
    groups: multiGroup ? groupOptions : [],
    names: { keywords: new Map(keywordOptions), groups: new Map(groupOptions) },
  };
}
