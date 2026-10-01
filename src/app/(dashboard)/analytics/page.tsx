import { PageHeader, RangeLinks } from '@/components/ui';
import { UrlFilters } from '@/components/url-filters';
import { PLATFORM_NAMES, day } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { withParams, type SearchParams } from '@/lib/params';
import { Breakdowns } from './breakdowns';
import { ParamTabs } from './charts';
import { Overview } from './overview';
import { Reviews } from './reviews';
import { ShareOfVoice } from './voice';
import { RANGES, keywordName, readWindow } from './window';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics' };

/** One window, four reports: overview, breakdowns, share of voice and reviews. */
export default async function Analytics({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { query, tab: asked, range } = readWindow(params);
  const api = mentio();
  const [summary, reviews, keywords] = await Promise.all([
    api.getAnalyticsSummary({ query: { ...query, compare: true } }).then(unwrap),
    api.getReviewsReport({ query: { ...query, compare: true } }).then(unwrap),
    api.listKeywords({ query: { sort: 'term' } }).then(unwrap),
  ]);
  const hasReviews = reviews.totals.reviews > 0;
  const tab = asked === 'reviews' && !hasReviews ? 'overview' : asked;
  const tabHref = (value: string) => withParams('/analytics', params, { tab: value === 'overview' ? undefined : value });
  const tabs = [
    { value: 'overview', label: 'Overview', href: tabHref('overview') },
    { value: 'breakdowns', label: 'Breakdowns', href: tabHref('breakdowns') },
    { value: 'voice', label: 'Share of voice', href: tabHref('voice') },
    ...(hasReviews ? [{ value: 'reviews', label: 'Reviews', href: tabHref('reviews') }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description={`${day(summary.window.from)} to ${day(summary.window.to)}, ${summary.window.days} days, compared with the ${summary.window.days} days before.`}
        actions={<RangeLinks current={range} options={RANGES} href={(value) => withParams('/analytics', params, { range: value, from: undefined, to: undefined })} />}
      />

      <UrlFilters
        keep={['tab', 'range']}
        reset={[]}
        filters={[
          { param: 'keywordIds', label: 'Keyword', icon: 'tag', kind: 'multi', options: keywords.data.map((k) => ({ value: k.id, label: `${keywordName(k)} (${k.kind})` })) },
          { param: 'platforms', label: 'Platform', icon: 'platform', kind: 'multi', options: Object.entries(PLATFORM_NAMES).map(([value, label]) => ({ value, label, platform: value })) },
          { param: 'from', label: 'Dates', icon: 'calendar', kind: 'dates', untilParam: 'to' },
        ]}
      />

      <ParamTabs current={tab} items={tabs} />

      {tab === 'overview' ? <Overview query={query} summary={summary} /> : null}
      {tab === 'breakdowns' ? <Breakdowns query={query} window={summary.window} /> : null}
      {tab === 'voice' ? <ShareOfVoice query={query} /> : null}
      {tab === 'reviews' ? <Reviews report={reviews} query={query} /> : null}
    </div>
  );
}
