import type { AnalyticsSummary } from '@mentio-dev/sdk';
import { PlatformIcon } from '@/components/platform-icon';
import { BarList, CHART_COLORS, Card, StackedBars, Stat } from '@/components/ui';
import { compact, platformName } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { keywordName, mentionsHref, type WindowQuery } from './window';

const duration = (ms: number | null) => {
  if (ms === null) return 'None done';
  const hours = ms / 3_600_000;
  return hours < 1 ? `${Math.max(1, Math.round(ms / 60_000))} min` : hours < 48 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} days`;
};

/** Headline numbers against the previous window, the trend, and where it came from. */
export async function Overview({ query, summary }: { query: WindowQuery; summary: AnalyticsSummary }) {
  const api = mentio();
  const [series, byPlatform, platforms, keywords] = await Promise.all([
    api.getAnalyticsSeries({ query: { ...query, compare: true } }).then(unwrap),
    api.getAnalyticsSeries({ query: { ...query, by: 'platform' } }).then(unwrap),
    api.getAnalyticsBreakdown({ query: { ...query, by: 'platform' } }).then(unwrap),
    api.getAnalyticsBreakdown({ query: { ...query, by: 'keyword' } }).then(unwrap),
  ]);
  const prev = summary.previous;
  const link = (extra: Record<string, string>) => mentionsHref(summary.window, query, extra);
  const points = series.data[0]?.points ?? [];
  const previous = series.previous?.[0]?.points ?? [];
  const labels = points.map((p) => p.date);
  const pct = (now: number, before?: number | null) => (before ? ((now - before) / before) * 100 : null);
  const scored = summary.sentiment.positive + summary.sentiment.neutral + summary.sentiment.negative;

  // The five busiest platforms keep their color; the rest fold into "Other".
  const total = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const ranked = [...byPlatform.data].sort((a, b) => total(b.points.map((p) => p.matched)) - total(a.points.map((p) => p.matched)));
  const stacks = ranked.slice(0, 5).map((s, i) => ({ name: platformName(s.key), color: CHART_COLORS[i], values: s.points.map((p) => p.matched) }));
  if (ranked.length > 5) stacks.push({ name: 'Other', color: '#d4d4d8', values: labels.map((_, i) => total(ranked.slice(5).map((s) => s.points[i]?.matched ?? 0))) });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
        <Stat label="Matched" value={compact(summary.matched)} delta={pct(summary.matched, prev?.matched)} spark={points.map((p) => p.matched)} hint={`${compact(summary.posts)} posts`} href={link({})} />
        <Stat
          label="Relevant"
          value={compact(summary.relevant)}
          delta={pct(summary.relevant, prev?.relevant)}
          spark={points.map((p) => p.relevant)}
          hint={summary.matched ? `${Math.round((summary.relevant / summary.matched) * 100)}% of matched` : undefined}
          href={link({ relevant: 'true' })}
        />
        <Stat
          label="Negative"
          value={compact(summary.sentiment.negative)}
          delta={pct(summary.sentiment.negative, prev?.sentiment.negative)}
          invert
          spark={points.map((p) => p.negative)}
          hint={scored ? `${Math.round((summary.sentiment.negative / scored) * 100)}% of classified` : undefined}
          href={link({ sentiments: 'negative' })}
        />
        <Stat label="Est. reach" value={compact(summary.reach.followers)} delta={pct(summary.reach.followers, prev?.reach.followers)} hint={`${compact(summary.reach.people)} authors known`} />
        <Stat label="People" value={compact(summary.people)} delta={pct(summary.people, prev?.people)} />
        <Stat label="Posts" value={compact(summary.posts)} delta={pct(summary.posts, prev?.posts)} />
        <Stat label="Buying intent" value={compact(summary.buyIntent)} delta={pct(summary.buyIntent, prev?.buyIntent)} href={link({ intents: 'buy_intent' })} />
        <Stat label="Questions" value={compact(summary.questions)} delta={pct(summary.questions, prev?.questions)} href={link({ intents: 'question' })} />
      </div>

      <Card title="Mentions over time" description={`Per ${series.window.bucket}. Bars are matched mentions split by platform; the dark line is relevant ones, the dashed line the previous period.`}>
        <StackedBars
          labels={labels}
          stacks={stacks}
          lines={[
            { name: 'Relevant', color: '#18181b', values: points.map((p) => p.relevant) },
            ...(previous.length === points.length ? [{ name: 'Previous period', color: '#a1a1aa', values: previous.map((p) => p.matched), dashed: true }] : []),
          ]}
        />
      </Card>

      <Card title="Sentiment over time" description={`${compact(summary.sentiment.unclassified)} matches not scored yet.`}>
        <StackedBars
          labels={labels}
          height={160}
          stacks={[
            { name: 'Positive', color: '#10b981', values: points.map((p) => p.positive) },
            { name: 'Neutral', color: '#d4d4d8', values: points.map((p) => p.neutral) },
            { name: 'Negative', color: '#ef4444', values: points.map((p) => p.negative) },
          ]}
        />
      </Card>

      <div className="grid gap-6 @4xl:grid-cols-2">
        <Card title="Top platforms">
          <BarList items={platforms.data.slice(0, 8).map((r) => ({ label: platformName(r.key), value: r.matched, href: link({ platforms: r.key }), icon: <PlatformIcon platform={r.key} /> }))} />
        </Card>
        <Card title="Top keywords">
          <BarList
            items={keywords.data.slice(0, 8).map((r) => ({
              label: r.keyword ? keywordName(r.keyword) : r.label,
              value: r.matched,
              href: r.keyword ? link({ keywordIds: r.keyword.id }) : undefined,
            }))}
          />
        </Card>
      </div>

      <Card title="Inbox" description="Where this window's matches stand.">
        <div className="grid gap-3 @lg:grid-cols-3 @4xl:grid-cols-6">
          <Stat label="Open" value={compact(summary.triage.open)} href={link({ status: 'open' })} />
          <Stat label="Done" value={compact(summary.triage.done)} href={link({ status: 'done' })} />
          <Stat label="Ignored" value={compact(summary.triage.ignored)} href={link({ status: 'ignored' })} />
          <Stat label="Waiting over 24 h" value={compact(summary.triage.waiting)} hint="Relevant and still open" />
          <Stat label="Handled" value={summary.triage.handledRate === null ? 'n/a' : `${Math.round(summary.triage.handledRate * 100)}%`} hint="Done out of relevant" />
          <Stat label="Median time to done" value={<span className="text-base">{duration(summary.triage.medianTimeToDoneMs)}</span>} />
        </div>
      </Card>
    </div>
  );
}
