/** What a rule form and a filter summary need to name things: channels, keywords, groups. */
import { mentio, unwrap } from '@/lib/mentio';

export async function loadRuleContext() {
  const api = mentio();
  const [channels, keywords, groups] = await Promise.all([
    api.listChannels().then(unwrap),
    api.listKeywords({ query: { sort: 'term' } }).then(unwrap),
    api.listGroups().then(unwrap),
  ]);
  return {
    channels: channels.data,
    keywords: keywords.data,
    groups: groups.data,
    names: {
      keywords: new Map(keywords.data.map((k) => [k.id, k.term])),
      groups: new Map(groups.data.map((g) => [g.id, g.name])),
    },
  };
}
