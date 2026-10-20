import { ChartNoAxesCombined } from 'lucide-react';
import { Card, EmptyState, LinkButton, PageHeader, RangeLinks } from '@/components/ui';
import { FaceoffCharts, type FaceoffKeyword } from '@/components/contest/faceoff-charts';
import { compact } from '@/lib/format';
import { groupCandidates } from '@/lib/insights';
import { mentio, unwrap } from '@/lib/mentio';
import { one, withParams, type SearchParams } from '@/lib/params';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cara a cara' };

const RANGES = ['7d', '30d', '90d'] as const;
type Range = (typeof RANGES)[number];

function pluralPlaces(count: number) {
  return count === 1 ? 'un lugar' : `${count} lugares`;
}

function rankNote(current: number, previous: number, previousMentions: number) {
  if (previousMentions === 0) return 'la semana pasada no registraste menciones';
  if (previous === current) return 'mantienes el mismo lugar';
  if (previous > current) return `subiste ${pluralPlaces(previous - current)}`;
  return `bajaste ${pluralPlaces(current - previous)}`;
}

function addDays(day: string, offset: number) {
  const date = new Date(`${day.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export default async function ContiendaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const requestedRange = one(params, 'range');
  const range: Range = (RANGES as readonly string[]).includes(requestedRange ?? '')
    ? (requestedRange as Range)
    : '30d';
  const api = mentio();
  const configured = unwrap(await api.listKeywords({
    query: { kind: ['brand', 'competitor'], sort: 'term' },
  })).data;
  const grouped = groupCandidates(configured);
  const brands = grouped.filter((candidate) => candidate.kind === 'brand');
  const competitors = grouped.filter((candidate) => candidate.kind === 'competitor');
  const rangeLinks = <RangeLinks
    current={range}
    options={RANGES}
    href={(value) => withParams('/contienda', params, { range: value, from: undefined, to: undefined })}
  />;

  if (!brands.length || !competitors.length) {
    const missing = [!brands.length ? 'candidato' : null, !competitors.length ? 'adversarios' : null]
      .filter(Boolean)
      .join(' y ');
    return (
      <div>
        <PageHeader
          title="Cara a cara"
          description="Compara cuánto se habla de tu candidato y de sus adversarios, y con qué tono."
          actions={rangeLinks}
        />
        <EmptyState
          icon={ChartNoAxesCombined}
          title={`Falta registrar ${missing}.`}
          action={<LinkButton href="/arranque" variant="primary">Ir al asistente</LinkButton>}
        >
          Agrega el nombre de tu candidato y al menos un adversario para comparar su conversación.
        </EmptyState>
      </div>
    );
  }

  const contenderIds = [...brands, ...competitors].flatMap((candidate) => candidate.keywordIds);
  const voicePromise = api.getShareOfVoice({ query: { range, compare: true, keywordIds: contenderIds } }).then(unwrap);
  const weekPromise = range === '7d'
    ? voicePromise
    : api.getShareOfVoice({ query: { range: '7d', compare: true, keywordIds: contenderIds } }).then(unwrap);
  const [voice, weekly] = await Promise.all([voicePromise, weekPromise]);
  const previousWeek = unwrap(await api.getShareOfVoice({
    query: {
      from: addDays(weekly.window.from, -weekly.window.days),
      to: addDays(weekly.window.from, -1),
      keywordIds: contenderIds,
    },
  }));
  type Candidate = (typeof grouped)[number];
  type CandidateTotals = Candidate & { matched: number; previousMatched: number; share: number };
  const aggregate = (data: typeof voice.data, candidates: Candidate[]): CandidateTotals[] => {
    const idToCandidate = new Map<string, Candidate>();
    for (const candidate of candidates) for (const id of candidate.keywordIds) idToCandidate.set(id, candidate);
    const totals = new Map<string, { matched: number; previousMatched: number; share: number; hasShare: boolean }>();
    for (const candidate of candidates) totals.set(candidate.mainId, { matched: 0, previousMatched: 0, share: 0, hasShare: false });

    for (const row of data) {
      const candidate = idToCandidate.get(row.keyword.id);
      const total = candidate ? totals.get(candidate.mainId) : undefined;
      if (!candidate || !total) continue;
      total.matched += row.matched;
      total.previousMatched += row.previous?.matched ?? 0;
      if (row.share !== null) {
        total.share += row.share;
        total.hasShare = true;
      }
    }
    const contenderMentions = [...totals.values()].reduce((sum, total) => sum + total.matched, 0);
    return candidates.map((candidate) => {
      const total = totals.get(candidate.mainId)!;
      return {
        ...candidate,
        matched: total.matched,
        previousMatched: total.previousMatched,
        share: total.hasShare ? total.share : contenderMentions ? (total.matched / contenderMentions) * 100 : 0,
      };
    });
  };

  const allTotals = aggregate(voice.data, [...brands, ...competitors]);
  const currentBrands = allTotals.filter((candidate) => candidate.kind === 'brand');
  const currentCompetitors = allTotals.filter((candidate) => candidate.kind === 'competitor');
  const brandRows = [...currentBrands].sort((a, b) => b.matched - a.matched).slice(0, 8);
  const competitorRows = [...currentCompetitors].sort((a, b) => b.matched - a.matched).slice(0, 8);
  const visible = [...brandRows, ...competitorRows];
  const toneSummaries = await Promise.all(visible.map((candidate) =>
    api.getAnalyticsSummary({ query: { range, keywordIds: candidate.keywordIds } }).then(unwrap),
  ));
  const summariesById = new Map(visible.map((candidate, index) => [candidate.mainId, toneSummaries[index]] as const));

  const faceoffData = (rows: CandidateTotals[]): FaceoffKeyword[] => rows.map((candidate) => {
    const sentiment = summariesById.get(candidate.mainId)?.sentiment;
    return {
      id: candidate.mainId,
      label: candidate.name,
      share: candidate.share,
      matched: candidate.matched,
      tone: {
        positive: sentiment?.positive ?? 0,
        neutral: sentiment?.neutral ?? 0,
        negative: sentiment?.negative ?? 0,
        unclassified: sentiment?.unclassified ?? 0,
      },
    };
  });

  const priorTotals = aggregate(previousWeek.data, [...brands, ...competitors]);
  const priorById = new Map(priorTotals.map((candidate) => [candidate.mainId, candidate.matched] as const));
  const weeklyTotals = aggregate(weekly.data, [...brands, ...competitors]).map((candidate) => ({
    ...candidate,
    previousMatched: priorById.get(candidate.mainId) ?? 0,
  }));
  const currentOrder = [...weeklyTotals].sort((a, b) => b.matched - a.matched || a.name.localeCompare(b.name, 'es'));
  const previousOrder = [...weeklyTotals].sort((a, b) => b.previousMatched - a.previousMatched || a.name.localeCompare(b.name, 'es'));
  const rankings = brands.map((brand) => {
    const row = weeklyTotals.find((item) => item.mainId === brand.mainId);
    const currentRank = currentOrder.findIndex((item) => item.mainId === brand.mainId) + 1;
    const previousRank = previousOrder.findIndex((item) => item.mainId === brand.mainId) + 1;
    return row && row.matched > 0 && currentRank > 0 && previousRank > 0
      ? { label: brand.name, currentRank, previousRank, previousMentions: row.previousMatched }
      : null;
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  const totalContenders = brands.length + competitors.length;
  const rankedCount = totalContenders;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cara a cara"
        description="Compara la participación de voz y el tono de tu candidato frente a sus adversarios."
        actions={rangeLinks}
      />

      <FaceoffCharts brand={faceoffData(brandRows)} competitors={faceoffData(competitorRows)} />
      <p className="-mt-2 text-xs text-muted-foreground">
        Se muestran hasta 8 candidatos o adversarios, ordenados por menciones; los apodos se suman a su nombre principal.
      </p>

      <Card
        title="Posición de esta semana"
        description="La posición se calcula por menciones de los últimos 7 días y se compara con la semana anterior."
      >
        {rankings.length ? (
          <ul className="space-y-2">
            {rankings.map((ranking) => (
              <li key={ranking.label} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-medium">{ranking.label}:</span>
                <span>{`Vas ${ranking.currentRank}º de ${rankedCount}${ranking.previousMentions > 0 ? `, la semana pasada estabas ${ranking.previousRank}º` : ''}, ${rankNote(ranking.currentRank, ranking.previousRank, ranking.previousMentions)}.`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay menciones suficientes para calcular una posición semanal.
          </p>
        )}
        {allTotals.every((candidate) => candidate.matched === 0) ? (
          <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
            No hay menciones de candidatos ni adversarios en los últimos {range.slice(0, -1)} días.
          </p>
        ) : null}
        {totalContenders > 16 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            En total hay {compact(totalContenders)} candidatos y adversarios registrados.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
