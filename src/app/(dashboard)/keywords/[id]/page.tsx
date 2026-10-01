import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Badge, Card, LinkButton, Notice, PageHeader, Stat, Table, td, TableCell, TableRow } from '@/components/ui';
import { compact, date, money, platformName, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { KeywordActions } from '../keyword-actions';
import { KeywordForm } from '../keyword-form';
import { KeywordBadges, KIND_LABELS, platformsLabel } from '../shared';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Keyword' };

/** One keyword: its numbers, its health, and every setting. */
export default async function KeywordDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, groups] = await Promise.all([mentio().getKeyword({ path: { id } }), mentio().listGroups().then(unwrap)]);
  if (result.response?.status === 404) notFound();
  const keyword = unwrap(result);
  const { stats } = keyword;
  const mentionsHref = `/mentions?keywordIds=${encodeURIComponent(keyword.id)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/keywords', label: 'Keywords' }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {keyword.term}
            <KeywordBadges keyword={keyword} />
          </span>
        }
        description={`${KIND_LABELS[keyword.kind]} in ${keyword.group.name}. ${platformsLabel(keyword)}. Tracked since ${date(keyword.createdAt)}.`}
        actions={
          <>
            <LinkButton href={mentionsHref}>View mentions</LinkButton>
            <KeywordActions keyword={keyword} backToList size="md" />
          </>
        }
      />

      {keyword.pausedForBalance ? (
        <Notice tone="warn">Paused because the balance ran out. A top-up resumes it.</Notice>
      ) : null}
      {keyword.pausedForNoise ? (
        <Notice tone="warn">Paused by the noise brake: most of its matches were irrelevant. Change its required or excluded terms, platforms or context, or resume it by hand.</Notice>
      ) : null}
      {stats.noise.noisy ? (
        <Notice tone="bad">
          Noisy: only {stats.noise.relevant} of the {stats.noise.scored} mentions scored in the last 14 days were relevant. Every match bills, so tighten it below with required terms, excluded terms or context.
        </Notice>
      ) : null}

      <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-5">
        <Stat label="Mentions" value={compact(stats.mentions)} hint="every match ever" href={mentionsHref} />
        <Stat label="Relevant" value={compact(stats.relevant)} hint={`${stats.feedback.relevant} marked relevant, ${stats.feedback.notRelevant} not`} />
        <Stat label="Last 7 days" value={compact(stats.last7d)} hint={stats.lastMentionAt ? `last ${timeAgo(stats.lastMentionAt)}` : 'none yet'} />
        <Stat label="This month" value={compact(stats.thisMonth)} hint={keyword.cap ? `cap ${compact(keyword.cap.mentions)}` : 'no cap'} />
        <Stat label="Cost this month" value={money(stats.cost.totalCents)} hint={`${stats.cost.keywordDays} days ${money(stats.cost.keywordCents)}, ${compact(stats.cost.billableMentions)} mentions ${money(stats.cost.mentionCents)}`} />
      </div>

      <div className="grid gap-6 @4xl:grid-cols-2">
        <Card title="Monthly cap">
          {keyword.cap ? (
            <div className="space-y-2 text-sm">
              <p>
                {compact(stats.thisMonth)} of {compact(keyword.cap.mentions)} mentions used this month (UTC).
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (stats.thisMonth / Math.max(1, keyword.cap.mentions)) * 100)}%` }} />
              </div>
              {keyword.pausedForCap ? (
                <p className="text-amber-700">At its cap: not matching until the first of next month or until the cap is raised. It still counts as a keyword day.</p>
              ) : null}
              {keyword.cap.welcome ? (
                <p className="text-xs text-muted-foreground">
                  Welcome cap: a workspace on its welcome credit collects at most {keyword.cap.mentions} mentions a keyword a month. The first top-up {keyword.cap.own ? `sets it back to ${compact(keyword.cap.own)}` : 'removes it'}.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No cap: every match is collected and billed.</p>
          )}
        </Card>

        <Card title="Polling" description="Poll health per platform. Live feeds like Bluesky have no entry.">
          {keyword.polling.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not polled yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {keyword.polling.map((p) => (
                <li key={p.platform} className="flex items-center justify-between gap-2 py-1.5">
                  <span>{platformName(p.platform)}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {p.lastPolledAt ? timeAgo(p.lastPolledAt) : 'never'}
                    {p.emptyPolls > 0 ? <Badge tone={p.emptyPolls >= 10 ? 'warn' : 'neutral'}>{p.emptyPolls} empty in a row</Badge> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {keyword.reviewSources.length > 0 ? (
        <Table head={['Review page', 'Countries', 'Language', 'Connected']}>
          {keyword.reviewSources.map((src) => (
            <TableRow key={`${src.platform}:${src.id}`}>
              <TableCell className={td}>
                {platformName(src.platform)}{' '}
                <a href={src.url} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{src.id}</a>
              </TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground`}>{src.countries.join(', ').toUpperCase() || 'One page'}</TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground`}>{src.language ?? ''}</TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground`}>{date(src.connectedAt)}</TableCell>
            </TableRow>
          ))}
        </Table>
      ) : null}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Settings</h2>
        <KeywordForm keyword={keyword} groups={groups.data} />
      </div>
    </div>
  );
}


