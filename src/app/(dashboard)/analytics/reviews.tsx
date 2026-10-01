import type { ReviewsReport } from '@mentio-dev/sdk';
import { BarList, Card, Stat, Table, td, TableCell, TableRow } from '@/components/ui';
import { compact, platformName, tagName } from '@/lib/format';
import { Delta, Sparkline } from './charts';
import { mentionsHref, type WindowQuery } from './window';

const REVIEW_PLATFORMS = 'appstore,googleplay,trustpilot,googlemaps';
const STARS = [5, 4, 3, 2, 1] as const;
const stars = (n: number | null) => (n === null ? 'n/a' : `${n.toFixed(1)} ★`);

/** Ratings, per review page, and what the 1 and 2 star reviews are about. */
export function Reviews({ report, query }: { report: ReviewsReport; query: WindowQuery }) {
  const { totals, previous } = report;
  const link = (extra: Record<string, string>) => mentionsHref(report.window, query, { platforms: query.platforms?.join(',') || REVIEW_PLATFORMS, ...extra });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-4">
        <Stat label="Reviews" value={compact(totals.reviews)} hint={<Delta current={totals.reviews} previous={previous?.reviews} />} href={link({})} />
        <Stat
          label="Average rating"
          value={stars(totals.averageRating)}
          hint={previous?.averageRating != null && totals.averageRating !== null ? `${previous.averageRating.toFixed(1)} ★ before` : undefined}
        />
        <Stat label="Replied to" value={compact(totals.responded)} hint={totals.reviews ? `${Math.round((totals.responded / totals.reviews) * 100)}% of reviews` : undefined} />
        <Stat label="Open 1 and 2 star" value={compact(totals.openNegative)} hint="Not marked done or ignored" href={link({ ratings: '1,2', status: 'open' })} />
      </div>

      <div className="grid gap-6 @4xl:grid-cols-2">
        <Card title="Stars">
          <BarList items={STARS.map((s) => ({ label: `${s} ★`, value: totals.distribution[s], href: link({ ratings: String(s) }) }))} />
        </Card>
        <Card title="What unhappy reviews are about" description="Tags on the 1 and 2 star reviews.">
          <BarList items={report.tags.slice(0, 10).map((t) => ({ label: tagName(t.tag), value: t.count, href: link({ ratings: '1,2', intents: t.tag }) }))} />
        </Card>
      </div>

      <Table head={['Page', 'Reviews', 'Trend', 'Average', '1 to 5 stars', 'Replied', 'Open negative']}>
        {report.pages.map((page) => (
          <TableRow key={`${page.platform}:${page.id}`}>
            <TableCell className={td}>
              <a href={page.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">{page.id}</a>
              <p className="text-xs text-muted-foreground">{platformName(page.platform)}</p>
            </TableCell>
            <TableCell className={`${td} tabular-nums`}>
              {compact(page.reviews)}
              {page.previous ? <p className="text-xs"><Delta current={page.reviews} previous={page.previous.reviews} short /></p> : null}
            </TableCell>
            <TableCell className={td}><Sparkline values={page.series.map((p) => p.reviews)} /></TableCell>
            <TableCell className={`${td} tabular-nums whitespace-nowrap`}>{stars(page.averageRating)}</TableCell>
            <TableCell className={`${td} text-xs tabular-nums whitespace-nowrap text-muted-foreground`}>{([1, 2, 3, 4, 5] as const).map((s) => page.distribution[s]).join(' · ')}</TableCell>
            <TableCell className={`${td} tabular-nums`}>{compact(page.responded)}</TableCell>
            <TableCell className={`${td} tabular-nums`}>{compact(page.openNegative)}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
