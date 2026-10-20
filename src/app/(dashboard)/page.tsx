import type { Mention } from '@mentio-dev/sdk';
import { BrandInsightCard } from '@/components/home/brand-insight-card';
import { CrisisBanner } from '@/components/home/crisis-banner';
import { NoBrandCard } from '@/components/home/no-brand-card';
import { QuickLinks } from '@/components/home/quick-links';
import { PageHeader } from '@/components/ui';
import { mentio, unwrap } from '@/lib/mentio';
import { groupCandidates, trafficLight, type CandidateGroup } from '@/lib/insights';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inicio' };

export default async function Home() {
  const api = mentio();
  const keywordList = await api.listKeywords({ query: { limit: 500, sort: 'term' } }).then(unwrap);
  const keywordGroups = groupCandidates(keywordList.data);
  const brands = keywordGroups.filter((candidate) => candidate.kind === 'brand');
  const topicCandidates = keywordGroups.filter((candidate) => candidate.kind === 'topic');
  const keywordById = new Map(keywordList.data.map((keyword) => [keyword.id, keyword]));
  const campaignId = (candidate: CandidateGroup) => keywordById.get(candidate.mainId)?.group.id;
  const brandGroupIds = new Set(brands.map(campaignId).filter((id): id is string => Boolean(id)));
  const topicsByGroup = new Map<string, CandidateGroup[]>();

  for (const topic of topicCandidates) {
    const groupId = campaignId(topic);
    if (!groupId || !brandGroupIds.has(groupId)) continue;
    const groupTopics = topicsByGroup.get(groupId) ?? [];
    groupTopics.push(topic);
    topicsByGroup.set(groupId, groupTopics);
  }

  const [brandMetrics, topicBreakdowns] = await Promise.all([
    Promise.all(brands.map(async (candidate) => {
      const [summary, series] = await Promise.all([
        api.getAnalyticsSummary({ query: { range: '30d', compare: true, keywordIds: candidate.keywordIds } }).then(unwrap),
        api.getAnalyticsSeries({ query: { range: '7d', bucket: 'day', keywordIds: candidate.keywordIds } }).then(unwrap),
      ]);
      return {
        candidate,
        summary,
        series: series.data[0]?.points ?? [],
      };
    })),
    Promise.all([...topicsByGroup].map(async ([groupId, topics]) => {
      const breakdown = await api.getAnalyticsBreakdown({
        query: { range: '30d', by: 'keyword', keywordIds: topics.flatMap((topic) => topic.keywordIds) },
      }).then(unwrap);
      const candidateByKeywordId = new Map(topics.flatMap((topic) => topic.keywordIds.map((id) => [id, topic] as const)));
      const countsByCandidate = new Map<string, number>();
      for (const row of breakdown.data) {
        const candidate = row.keyword ? candidateByKeywordId.get(row.keyword.id) : undefined;
        if (candidate) countsByCandidate.set(candidate.mainId, (countsByCandidate.get(candidate.mainId) ?? 0) + row.matched);
      }
      const primary = [...topics]
        .sort((a, b) => (countsByCandidate.get(b.mainId) ?? 0) - (countsByCandidate.get(a.mainId) ?? 0))[0];
      return [groupId, primary && (countsByCandidate.get(primary.mainId) ?? 0) > 0 ? primary.name : undefined] as const;
    })),
  ]);

  const topics = new Map(topicBreakdowns);
  const crisisBrands = brandMetrics.filter(({ summary }) => trafficLight(summary, summary.previous).isCrisis);
  let crisisMentions: Mention[] = [];

  if (crisisBrands.length) {
    const window = crisisBrands[0].summary.window;
    const result = await api.searchMentions({
      query: {
        keywordIds: crisisBrands.flatMap(({ candidate }) => candidate.keywordIds),
        sentiments: ['negative'],
        sort: 'priority',
        limit: 100,
        since: `${window.from}T00:00:00Z`,
        until: `${window.to}T23:59:59Z`,
      },
    }).then(unwrap);
    crisisMentions = [...result.data]
      .sort((a, b) => (b.author?.followers ?? -1) - (a.author?.followers ?? -1) || b.priority - a.priority)
      .slice(0, 5);
  }

  const crisisHref = `/mentions?${new URLSearchParams({
    keywordIds: crisisBrands.flatMap(({ candidate }) => candidate.keywordIds).join(','),
    sentiments: 'negative',
  })}`;
  const crisisCandidateNames = Object.fromEntries(crisisBrands.flatMap(({ candidate }) => candidate.keywordIds.map((id) => [id, candidate.name])));

  return (
    <div className="@container/home space-y-6">
      <PageHeader title="Inicio" description="En unos segundos puedes ver cómo va la conversación sobre tu candidato y qué merece atención." />

      {crisisBrands.length ? <CrisisBanner mentions={crisisMentions} href={crisisHref} candidateCount={crisisBrands.length} candidateNames={crisisCandidateNames} /> : null}

      {brandMetrics.length ? (
        <section aria-label="Semáforo de tus candidatos" className="grid gap-4 @4xl/home:grid-cols-2">
          {brandMetrics.map(({ candidate, summary, series }) => (
            <BrandInsightCard
              key={candidate.mainId}
              candidate={candidate}
              summary={summary}
              previous={summary.previous}
              topic={topics.get(campaignId(candidate) ?? '')}
              series={series.map(({ date, matched }) => ({ date, matched }))}
            />
          ))}
        </section>
      ) : (
        <NoBrandCard />
      )}

      <QuickLinks />
    </div>
  );
}
