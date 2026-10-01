import type { AnalyticsBreakdown } from '@mentio-dev/sdk';
import { BarList, Card } from '@/components/ui';
import { platformName, tagName } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { HourHeatmap } from './charts';
import { keywordName, mentionsHref, type WindowQuery } from './window';

type Row = AnalyticsBreakdown['data'][number];
type By = AnalyticsBreakdown['by'];

const LANGUAGES = new Intl.DisplayNames(['en'], { type: 'language' });
const languageName = (code: string) => {
  if (code === 'unknown') return 'Unknown';
  try {
    return LANGUAGES.of(code) ?? code;
  } catch {
    return code;
  }
};

/** Each dimension: how to name a row and which feed filter it opens. */
const DIMENSIONS: Array<{ by: Exclude<By, 'hour'>; title: string; description?: string; label: (r: Row) => string; filter: (r: Row) => Record<string, string> | null }> = [
  { by: 'platform', title: 'Platform', label: (r) => platformName(r.key), filter: (r) => ({ platforms: r.key }) },
  { by: 'keyword', title: 'Keyword', label: (r) => (r.keyword ? keywordName(r.keyword) : r.label), filter: (r) => (r.keyword ? { keywordIds: r.keyword.id } : null) },
  { by: 'sentiment', title: 'Sentiment', label: (r) => tagName(r.key), filter: (r) => (r.key === 'unclassified' ? null : { sentiments: r.key }) },
  { by: 'intent', title: 'Intent', description: 'A mention can carry several, so shares overlap.', label: (r) => tagName(r.key), filter: (r) => ({ intents: r.key }) },
  { by: 'status', title: 'Status', label: (r) => tagName(r.key), filter: (r) => ({ status: r.key }) },
  { by: 'language', title: 'Language', label: (r) => languageName(r.key), filter: (r) => (r.key === 'unknown' ? null : { languages: r.key }) },
  { by: 'person', title: 'Top people', description: 'Who posted the most. Anonymous posts are left out.', label: (r) => r.person?.name ?? r.label, filter: () => null },
];

/** Every dimension the breakdown report groups by, each linking into the feed. */
export async function Breakdowns({ query, window }: { query: WindowQuery; window: { from: string; to: string } }) {
  const api = mentio();
  const [hour, ...reports] = await Promise.all([
    api.getAnalyticsBreakdown({ query: { ...query, by: 'hour' } }).then(unwrap),
    ...DIMENSIONS.map((d) => api.getAnalyticsBreakdown({ query: { ...query, by: d.by } }).then(unwrap)),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 @4xl:grid-cols-2">
        {DIMENSIONS.map((d, i) => (
          <Card key={d.by} title={d.title} description={d.description}>
            <BarList
              items={reports[i].data.slice(0, 12).map((row) => {
                const filter = d.filter(row);
                const href = d.by === 'person' ? (row.person?.id ? `/people/${row.person.id}` : undefined) : filter ? mentionsHref(window, query, filter) : undefined;
                return { label: d.label(row), value: row.matched, href };
              })}
              format="plain"
            />
          </Card>
        ))}
      </div>
      <Card title="When people post" description={`Matches by weekday and hour, ${hour.window.timezone}.`}>
        <HourHeatmap rows={hour.data} />
      </Card>
    </div>
  );
}
