import Link from 'next/link';
import { Download, Users, UsersRound } from 'lucide-react';
import { ActionForm, DrawerButton, SubmitButton } from '@/components/ui/client';
import { Badge, EmptyState, Field, Input, LinkButton, OffsetPager, PageHeader, Table, buttonClass, td, TableCell, TableRow, rowLink } from '@/components/ui';
import { UrlFilters } from '@/components/url-filters';
import { compact, platformName, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { one, withParams, type SearchParams } from '@/lib/params';
import { saveAsSegment } from './actions';
import { Avatar, SentimentBar, displayName } from './bits';
import { peopleFilterDefs } from './filter-defs';
import { SORT_LABELS, SORTS, audienceFilter, describeFilter, peopleQuery, stageName } from './filters';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'People' };

const LIMIT = 50;

/** The audience: everyone who mentioned you, filtered in the URL. */
export default async function People({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const offset = Math.max(0, Number(one(params, 'offset')) || 0);
  const filter = audienceFilter(params);
  const query = peopleQuery(params, { limit: LIMIT, offset });
  const api = mentio();
  const [page, segments, members] = await Promise.all([
    api.listPeople({ query }).then(unwrap),
    api.listSegments().then(unwrap),
    api.listMembers().then(unwrap),
  ]);
  const memberNames = new Map(members.data.map((m) => [m.userId, m.name ?? m.email]));
  const segment = query.segmentId ? segments.data.find((s) => s.id === query.segmentId) : undefined;
  const conditions = describeFilter(filter, memberNames);
  const filterQuery = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => (key === 'offset' || value === undefined ? [] : (Array.isArray(value) ? value : [value]).map((v) => [key, v]))),
  ).toString();

  return (
    <div className="space-y-4">
      <PageHeader
        title="People"
        description="Everyone who mentioned your keywords, one row per person across their accounts."
        actions={
          <>
            <a href={`/people/export${filterQuery ? `?${filterQuery}` : ''}`} className={buttonClass('secondary')} download>
              <Download /> Export CSV
            </a>
            <LinkButton href="/segments">Segments</LinkButton>
          </>
        }
      />

      <UrlFilters
        search={{ placeholder: 'Name, handle or profile URL' }}
        sort={{ options: SORTS.map((value) => ({ value, label: SORT_LABELS[value] })) }}
        filters={peopleFilterDefs(members.data, segments.data)}
        actions={
          conditions.length && !query.segmentId ? (
            <DrawerButton label="Save as segment" icon={<UsersRound />} title="Save as segment" description="Keeps these filters under a name; the members are worked out again on every read. Search and the first-seen date are not saved.">
              <ActionForm action={saveAsSegment} className="grid gap-4">
                <input type="hidden" name="query" value={filterQuery} />
                <Field label="Name"><Input name="name" required maxLength={80} placeholder="Unhappy power users" /></Field>
                <Field label="Description"><Input name="description" maxLength={500} /></Field>
                <div data-slot="form-actions" className="flex justify-end"><SubmitButton>Save segment</SubmitButton></div>
              </ActionForm>
            </DrawerButton>
          ) : null
        }
      />

      {segment ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-brand-soft/40 px-4 py-3 text-sm">
          <p>
            Segment <span className="font-medium">{segment.name}</span>
            {segment.description ? <span className="text-muted-foreground">: {segment.description}</span> : null}
          </p>
          <Link href={`/segments/${segment.id}`} className="text-primary hover:underline">Edit segment</Link>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{page.total} {page.total === 1 ? 'person' : 'people'}</p>

      {page.data.length === 0 ? (
        <EmptyState icon={Users} title="Nobody matches these filters.">Loosen a filter, or wait for new mentions to come in.</EmptyState>
      ) : (
        <Table head={['Person', 'Followers', 'Mentions', 'Sentiment', 'Stage', 'Tags', 'Last seen']}>
          {page.data.map((person) => (
            <TableRow key={person.id} className={person.annotations.muted ? 'text-muted-foreground' : ''}>
              <TableCell className={td}>
                <Link href={`/people/${person.id}`} data-row-link className={`flex min-w-48 items-center gap-2.5 hover:underline ${rowLink}`}>
                  <Avatar person={person} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{displayName(person)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[person.handle, ...new Set(person.accounts.map((a) => platformName(a.platform)))].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </Link>
              </TableCell>
              <TableCell className={`${td} tabular-nums`}>{person.reach.followers === null ? <span className="text-muted-foreground">?</span> : compact(person.reach.followers)}</TableCell>
              <TableCell className={`${td} tabular-nums whitespace-nowrap`}>
                {person.stats.mentions}
                <span className="ml-1 text-xs text-muted-foreground">{person.stats.relevant} relevant</span>
              </TableCell>
              <TableCell className={td}><SentimentBar sentiment={person.stats.sentiment} /></TableCell>
              <TableCell className={`${td} whitespace-nowrap`}>
                <span className="text-xs">{stageName(person.outreach.stage)}</span>
                {person.outreach.owner ? <span className="block text-xs text-muted-foreground">{person.outreach.owner.name ?? person.outreach.owner.email}</span> : null}
              </TableCell>
              <TableCell className={td}>
                <div className="flex flex-wrap gap-1">
                  {person.annotations.muted ? <Badge tone="warn">muted</Badge> : null}
                  {person.annotations.tags.map((t, tIndex) => <Badge key={`${t}-${tIndex}`}>{t}</Badge>)}
                </div>
              </TableCell>
              <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`}>{timeAgo(person.stats.lastSeenAt)}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <OffsetPager total={page.total} limit={LIMIT} offset={offset} href={(o) => withParams('/people', params, { offset: o ? String(o) : undefined })} />

    </div>
  );
}

