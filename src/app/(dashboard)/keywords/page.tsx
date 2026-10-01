import type { ListKeywordsData } from '@mentio-dev/sdk';
import { Tag, Plus } from 'lucide-react';
import Link from 'next/link';
import { EmptyState, LinkButton, OffsetPager, PageHeader, Table, td, TableCell, TableRow, rowLink } from '@/components/ui';
import { UrlFilters } from '@/components/url-filters';
import { isOneOf } from '@/lib/form';
import { compact, money, PLATFORM_NAMES, platformName, REVIEW_PLATFORMS, SEARCH_PLATFORMS, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { many, one, withParams, type SearchParams } from '@/lib/params';
import { KeywordActions } from './keyword-actions';
import { KeywordBadges, KIND_LABELS, KINDS, PlatformIcons, SORTS, STATUSES } from './shared';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Keywords' };

type Query = NonNullable<ListKeywordsData['query']>;
const LIMIT = 25;
const ALL_PLATFORMS = [...SEARCH_PLATFORMS, ...REVIEW_PLATFORMS];
const STATUS_IDS = STATUSES.map(([id]) => id);
const SORT_IDS = SORTS.map(([id]) => id);

/** What you listen for: every keyword with its state, its numbers and what it cost this month. */
export default async function Keywords({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const offset = Math.max(0, Number(one(params, 'offset')) || 0);
  const q = one(params, 'q');
  const groupIds = many(params, 'groupId');
  const kinds = many(params, 'kind').filter((k) => isOneOf(KINDS, k));
  const statuses = many(params, 'status').filter((v) => isOneOf(STATUS_IDS, v));
  const platforms = many(params, 'platform').filter((v) => isOneOf(ALL_PLATFORMS, v));
  const sort = one(params, 'sort');

  const query: Query = {
    limit: LIMIT,
    offset,
    ...(q ? { q } : {}),
    ...(groupIds.length ? { groupId: groupIds } : {}),
    ...(kinds.length ? { kind: kinds as Query['kind'] } : {}),
    ...(statuses.length ? { status: statuses as Query['status'] } : {}),
    ...(platforms.length ? { platform: platforms as Query['platform'] } : {}),
    ...(isOneOf(SORT_IDS, sort) ? { sort } : {}),
  };
  const [page, groups] = await Promise.all([mentio().listKeywords({ query }).then(unwrap), mentio().listGroups().then(unwrap)]);
  const showGroups = groups.data.length > 1;
  const filtered = Boolean(q || groupIds.length || kinds.length || statuses.length || platforms.length);

  return (
    <div>
      <PageHeader
        title="Keywords"
        description="Each keyword is searched on every platform unless you narrow it. A new one reads back 30 days at once."
        actions={<LinkButton href="/keywords/new" variant="primary" create><Plus /> New keyword</LinkButton>}
      />

      <UrlFilters
        search={{ placeholder: 'Search term or context' }}
        sort={{ options: SORTS.map(([value, label]) => ({ value, label })) }}
        filters={[
          ...(showGroups ? [{ param: 'groupId', label: 'Group', icon: 'folder', kind: 'multi', options: groups.data.map((g) => ({ value: g.id, label: g.name })) } as const] : []),
          { param: 'kind', label: 'Kind', icon: 'tag', kind: 'multi', options: KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] })) },
          { param: 'status', label: 'Status', icon: 'status', kind: 'multi', options: STATUSES.map(([value, label]) => ({ value, label })) },
          { param: 'platform', label: 'Platform', icon: 'platform', kind: 'multi', options: Object.entries(PLATFORM_NAMES).map(([value, label]) => ({ value, label, platform: value })) },
        ]}
        actions={<span className="ml-2 text-xs text-muted-foreground">{page.total} {page.total === 1 ? 'keyword' : 'keywords'}</span>}
      />

      {page.data.length === 0 ? (
        <EmptyState icon={Tag} title={filtered ? 'No keywords match these filters.' : 'No keywords yet.'}>
          {filtered ? null : <Link href="/keywords/new" className="text-primary hover:underline">Track your first keyword</Link>}
        </EmptyState>
      ) : (
        <Table head={['Keyword', 'Platforms', 'Last 7 days', 'This month', 'Relevant', 'Cost this month', '']}>
          {page.data.map((keyword) => (
            <TableRow key={keyword.id} className={keyword.muted ? 'text-muted-foreground' : ''}>
              <TableCell className={td}>
                <Link href={`/keywords/${keyword.id}`} data-row-link className={`font-medium text-foreground hover:underline ${rowLink}`}>{keyword.term}</Link>
                <span className="ml-2 text-xs text-muted-foreground">{KIND_LABELS[keyword.kind]}</span>
                {showGroups && !keyword.group.isDefault ? <span className="ml-2 text-xs text-muted-foreground">in {keyword.group.name}</span> : null}
                <div className="mt-1"><KeywordBadges keyword={keyword} /></div>
                {keyword.stats.noise.noisy ? (
                  <p className="mt-1 max-w-xs text-xs text-red-600">
                    Mostly irrelevant lately: {keyword.stats.noise.relevant} of {keyword.stats.noise.scored} relevant. Tighten it with required or excluded terms.
                  </p>
                ) : null}
              </TableCell>
              <TableCell className={`${td} max-w-48`}>
                <PlatformIcons keyword={keyword} />
              </TableCell>
              <TableCell className={`${td} tabular-nums`}>
                {compact(keyword.stats.last7d)}
                <div className="text-xs text-muted-foreground">{keyword.stats.lastMentionAt ? `last ${timeAgo(keyword.stats.lastMentionAt)}` : 'none yet'}</div>
              </TableCell>
              <TableCell className={`${td} tabular-nums`}>
                {compact(keyword.stats.thisMonth)}
                {keyword.cap ? <span className="text-xs text-muted-foreground"> / {compact(keyword.cap.mentions)}</span> : null}
              </TableCell>
              <TableCell className={`${td} tabular-nums`}>{compact(keyword.stats.relevant)}</TableCell>
              <TableCell className={`${td} tabular-nums`}>{money(keyword.stats.cost.totalCents)}</TableCell>
              <TableCell className={td}><KeywordActions keyword={keyword} /></TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <OffsetPager total={page.total} limit={LIMIT} offset={offset} href={(o) => withParams('/keywords', params, { offset: o ? String(o) : undefined })} />
    </div>
  );
}
