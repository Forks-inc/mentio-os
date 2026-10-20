import Link from 'next/link';
import { ArrowUpRight, Heart, MessageCircle, Users } from 'lucide-react';
import type { AnalyticsBreakdown, Person } from '@mentio-dev/sdk';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, Card, EmptyState, LinkButton, PageHeader, buttonClass } from '@/components/ui';
import { compact, platformName } from '@/lib/format';
import { groupCandidates } from '@/lib/insights';
import { mentio, unwrap } from '@/lib/mentio';
import type { SearchParams } from '@/lib/params';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Voceros y detractores' };

type PersonBreakdownRow = AnalyticsBreakdown['data'][number];
type VoiceCardRow = PersonBreakdownRow & { person: NonNullable<PersonBreakdownRow['person']> & { id: string } };

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase('es-MX') ?? '')
    .join('') || '•';
}

function personRows(rows: PersonBreakdownRow[]): VoiceCardRow[] {
  return rows.filter((row): row is VoiceCardRow => Boolean(row.person?.id));
}

function orderBySentiment(rows: VoiceCardRow[], sentiment: 'positive' | 'negative') {
  return [...rows].sort((a, b) => b.sentiment[sentiment] - a.sentiment[sentiment] || b.matched - a.matched);
}

function PersonCard({
  row,
  sentiment,
  detail,
}: {
  row: VoiceCardRow;
  sentiment: 'positive' | 'negative' | 'reach';
  detail: Person | null;
}) {
  const name = detail?.name ?? row.person.name ?? row.label;
  const handle = detail?.handle;
  const platform = platformName(detail?.platform ?? row.person.platform);
  const followers = detail?.reach.followers ?? row.person.followers;
  const avatar = detail?.avatarUrl ?? null;
  const Icon = sentiment === 'positive' ? Heart : sentiment === 'negative' ? MessageCircle : Users;
  const count = sentiment === 'positive' ? row.sentiment.positive : sentiment === 'negative' ? row.sentiment.negative : row.matched;
  const countLabel = sentiment === 'positive' ? 'menciones positivas' : sentiment === 'negative' ? 'menciones negativas' : 'menciones';

  return (
    <article className="rounded-lg border bg-card p-3 shadow-xs">
      <div className="flex items-start gap-3">
        <Avatar size="lg" aria-label={`Avatar de ${name}`}>
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" title={name}>{name}</p>
          {handle ? <p className="truncate text-xs text-muted-foreground">{handle}</p> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="neutral">{platform}</Badge>
            <Badge tone={sentiment === 'positive' ? 'good' : sentiment === 'negative' ? 'bad' : 'accent'}>
              <Icon className="mr-1 size-3" aria-hidden="true" />
              {compact(count)} {countLabel}
            </Badge>
            <Badge tone="neutral">{followers !== null && followers !== undefined ? `${compact(followers)} seguidores` : 'Seguidores sin dato'}</Badge>
          </div>
        </div>
      </div>
      <LinkButton href={`/people/${row.person.id}`} size="sm" className="mt-3 w-full justify-center">
        Seguir de cerca <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </LinkButton>
    </article>
  );
}

function VoiceColumn({
  title,
  description,
  rows,
  sentiment,
  details,
}: {
  title: string;
  description: string;
  rows: VoiceCardRow[];
  sentiment: 'positive' | 'negative' | 'reach';
  details: Map<string, Person | null>;
}) {
  return (
    <Card title={title} description={description}>
      {rows.length ? (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <PersonCard key={row.person.id} row={row} sentiment={sentiment} detail={details.get(row.person.id) ?? null} />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Aún no hay personas registradas en esta columna. Cuando lleguen más menciones, aparecerán aquí.
        </p>
      )}
    </Card>
  );
}

export default async function VocerosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const keywords = unwrap(await mentio().listKeywords({
    query: { status: ['active'], sort: 'term', limit: 500 },
  })).data;
  const candidates = groupCandidates(keywords).filter((candidate) => candidate.kind === 'brand');

  if (!candidates.length) {
    return (
      <div>
        <PageHeader title="Voceros y detractores" description="Conoce quién habla bien de tu candidato, quién lo critica y quién alcanza a más personas." />
        <EmptyState title="Aún no registras tu candidato." action={<LinkButton href="/arranque" variant="primary">Ir al asistente</LinkButton>}>
          Agrega el nombre del candidato y sus variantes para identificar las voces que mueven la conversación.
        </EmptyState>
      </div>
    );
  }

  const requestedCandidate = typeof params.candidate === 'string' ? params.candidate : undefined;
  const candidate = candidates.find((item) => item.mainId === requestedCandidate) ?? candidates[0];
  const api = mentio();
  const breakdowns = await Promise.all(chunks(candidate.keywordIds, 50).map((keywordIds) =>
    api.getAnalyticsBreakdown({ query: { by: 'person', range: '30d', keywordIds } }).then(unwrap),
  ));
  const byPerson = new Map<string, PersonBreakdownRow>();
  for (const row of breakdowns.flatMap((breakdown) => breakdown.data)) {
    const id = row.person?.id;
    if (!id) continue;
    const previous = byPerson.get(id);
    byPerson.set(id, previous ? {
      ...previous,
      matched: previous.matched + row.matched,
      relevant: previous.relevant + row.relevant,
      sentiment: {
        positive: previous.sentiment.positive + row.sentiment.positive,
        neutral: previous.sentiment.neutral + row.sentiment.neutral,
        negative: previous.sentiment.negative + row.sentiment.negative,
        unclassified: previous.sentiment.unclassified + row.sentiment.unclassified,
      },
    } : row);
  }
  const allPeople = personRows([...byPerson.values()]);
  const defenders = orderBySentiment(allPeople, 'positive')
    .filter((row) => row.sentiment.positive > row.sentiment.negative)
    .slice(0, 3);
  const critics = orderBySentiment(allPeople, 'negative')
    .filter((row) => row.sentiment.negative > row.sentiment.positive)
    .slice(0, 3);
  const peopleWithClearSentiment = new Set(allPeople
    .filter((row) => row.sentiment.positive !== row.sentiment.negative)
    .map((row) => row.person.id));
  const influencers = [...allPeople]
    .filter((row) => !peopleWithClearSentiment.has(row.person.id))
    .sort((a, b) => (b.person.followers ?? -1) - (a.person.followers ?? -1) || b.matched - a.matched)
    .slice(0, 3);
  const visiblePeople = [...new Set([...defenders, ...critics, ...influencers].map((row) => row.person.id))];
  const details = new Map<string, Person | null>(await Promise.all(
    visiblePeople.map(async (id) => {
      try {
        return [id, unwrap(await api.getPerson({ path: { id } }))] as const;
      } catch {
        return [id, null] as const;
      }
    }),
  ));
  const candidateHref = (id: string) => `/voceros?candidate=${encodeURIComponent(id)}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Voceros y detractores"
        description={`Últimos 30 días · voces que hablan de ${candidate.name} y cuántas personas alcanzan.`}
        actions={candidates.length > 1 ? (
          <nav className="flex flex-wrap gap-2" aria-label="Selecciona candidato">
            {candidates.map((item) => (
              <Link
                key={item.mainId}
                href={candidateHref(item.mainId)}
                aria-current={item.mainId === candidate.mainId ? 'page' : undefined}
                className={buttonClass(item.mainId === candidate.mainId ? 'primary' : 'secondary', 'sm')}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        ) : null}
      />

      <section className="grid gap-4 @4xl:grid-cols-3" aria-label="Voces sobre el candidato">
        <VoiceColumn
          title="Te defienden"
          description="Personas con más menciones positivas sobre tu candidato."
          rows={defenders}
          sentiment="positive"
          details={details}
        />
        <VoiceColumn
          title="Te atacan"
          description="Personas con más menciones negativas sobre tu candidato."
          rows={critics}
          sentiment="negative"
          details={details}
        />
        <VoiceColumn
          title="Mueven la conversación"
          description="Personas con mayor número de seguidores entre quienes mencionan a tu candidato."
          rows={influencers}
          sentiment="reach"
          details={details}
        />
      </section>
      <p className="text-xs text-muted-foreground">
        Las columnas consideran las variantes del candidato y solo muestran personas identificadas por la API.
      </p>
    </div>
  );
}
