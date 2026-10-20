import type { GetAnalyticsSeriesData } from '@mentio-dev/sdk';
import { CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { MentionTable } from '@/components/mention-table';
import { PlatformToggles } from '@/components/url-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, BarList, CHART_COLORS, Card, EmptyState, LinkButton, PageHeader, RangeLinks, StackedBars, Stat, cx } from '@/components/ui';
import { SEARCH_PLATFORMS, compact, platformName, tagName } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { many, one, withParams, type SearchParams } from '@/lib/params';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resumen' };

const RANGES = ['7d', '30d', '90d'] as const;
type Range = (typeof RANGES)[number];
type Platform = NonNullable<NonNullable<GetAnalyticsSeriesData['query']>['platforms']>[number];

/** Percent change, or null when there is nothing to compare with. */
const pct = (now: number, before?: number | null) => (before ? ((now - before) / before) * 100 : null);

/** The workspace at a glance: the numbers, the trend by platform, the keywords, and what needs an answer. */
export default async function Overview({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const range: Range = (RANGES as readonly string[]).includes(one(params, 'range') ?? '') ? (one(params, 'range') as Range) : '30d';
  const platforms = many(params, 'platforms').filter((p): p is Platform => (SEARCH_PLATFORMS as readonly string[]).includes(p) || p === 'appstore' || p === 'googleplay');
  const scope = { range, ...(platforms.length ? { platforms } : {}) };

  const api = mentio();
  const [summary, total, byPlatform, voice, intents, open] = await Promise.all([
    api.getAnalyticsSummary({ query: { ...scope, compare: true } }).then(unwrap),
    api.getAnalyticsSeries({ query: { ...scope, bucket: 'day', compare: true } }).then(unwrap),
    api.getAnalyticsSeries({ query: { ...scope, bucket: 'day', by: 'platform' } }).then(unwrap),
    api.getShareOfVoice({ query: { ...scope, compare: true } }).then(unwrap),
    api.getAnalyticsBreakdown({ query: { ...scope, by: 'intent' } }).then(unwrap),
    api.searchMentions({ query: { relevant: true, status: 'open', sort: 'priority', limit: 8, ...(platforms.length ? { platforms } : {}) } }).then(unwrap),
  ]);

  const points = total.data[0]?.points ?? [];
  const previous = total.previous?.[0]?.points ?? [];
  const labels = points.map((p) => p.date);
  const prev = summary.previous;
  const scored = summary.sentiment.positive + summary.sentiment.neutral + summary.sentiment.negative;
  const net = scored ? Math.round(((summary.sentiment.positive - summary.sentiment.negative) / scored) * 100) : 0;

  // Platforms by volume: the top five keep their color, the rest fold into "Other".
  const ranked = [...byPlatform.data].sort((a, b) => sum(b.points.map((p) => p.matched)) - sum(a.points.map((p) => p.matched)));
  const stacks = ranked.slice(0, 5).map((s, i) => ({ name: platformName(s.key), color: CHART_COLORS[i], values: s.points.map((p) => p.matched) }));
  const rest = ranked.slice(5);
  if (rest.length) stacks.push({ name: 'Otras plataformas', color: '#d4d4d8', values: labels.map((_, i) => sum(rest.map((s) => s.points[i]?.matched ?? 0))) });

  const href = (changes: Record<string, string | undefined>) => withParams('/', params, changes);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Resumen"
        description="Consulta qué dice el electorado sobre tus candidatos, los temas de agenda y sus adversarios; prioriza la conversación con datos."
        actions={<RangeLinks current={range} options={RANGES} href={(r) => href({ range: r })} />}
      />

      <div className="mb-4">
        <PlatformToggles platforms={SEARCH_PLATFORMS.map((p) => ({ value: p, label: platformName(p) }))} />
      </div>

      <section className="grid grid-cols-2 gap-3 @2xl:grid-cols-3 @6xl:grid-cols-6">
        <Stat label="Menciones" value={compact(summary.matched)} delta={pct(summary.matched, prev?.matched)} spark={points.map((p) => p.matched)} hint={`${compact(summary.posts)} publicaciones`} href="/mentions" />
        <Stat
          label="Relevantes"
          value={compact(summary.relevant)}
          delta={pct(summary.relevant, prev?.relevant)}
          spark={points.map((p) => p.relevant)}
          hint={summary.matched ? `${Math.round((summary.relevant / summary.matched) * 100)}% del total` : undefined}
          href="/mentions?relevant=true"
        />
        <Stat label="Sentimiento neto" value={`${net > 0 ? '+' : ''}${net}`} hint={`${compact(summary.sentiment.positive)} positivas · ${compact(summary.sentiment.negative)} negativas`} href="/analytics" />
        <Stat
          label="Negativas"
          value={compact(summary.sentiment.negative)}
          delta={pct(summary.sentiment.negative, prev?.sentiment.negative)}
          invert
          spark={points.map((p) => p.negative)}
          hint={scored ? `${Math.round((summary.sentiment.negative / scored) * 100)}% de las clasificadas` : undefined}
          href="/mentions?sentiments=negative"
        />
        <Stat label="Intención de compra" value={compact(summary.buyIntent)} delta={pct(summary.buyIntent, prev?.buyIntent)} hint={`${compact(summary.questions)} preguntas`} href="/mentions?intents=buy_intent" />
        <Stat label="Alcance estimado" value={compact(summary.reach.followers)} delta={pct(summary.reach.followers, prev?.reach.followers)} hint={`${compact(summary.reach.people)} autores identificados`} href="/people" />
      </section>

      <Card title="Menciones a lo largo del tiempo" description="Las barras muestran menciones por plataforma. La línea oscura representa las relevantes y la punteada, el periodo anterior.">
        <StackedBars
          labels={labels}
          stacks={stacks}
          lines={[
            { name: 'Relevantes', color: '#18181b', values: points.map((p) => p.relevant) },
            ...(previous.length === points.length ? [{ name: 'Periodo anterior', color: '#a1a1aa', values: previous.map((p) => p.matched), dashed: true }] : []),
          ]}
        />
      </Card>

      <section className="grid grid-cols-1 gap-4 @6xl:grid-cols-3">
        <div className="@6xl:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-line bg-card">
            <div className="flex items-start justify-between gap-2 px-4 pt-3.5 pb-3">
              <div>
                <h2 className="text-[13px] font-semibold">Candidatos y temas</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Compara la participación de voz de tus candidatos y adversarios; los temas de agenda se muestran aparte.</p>
              </div>
              <Link href="/keywords" className="text-xs text-primary hover:underline">Ver todos ›</Link>
            </div>
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 px-4 font-medium">Candidato o tema</TableHead>
                  <TableHead className="px-3 text-right font-medium">Menciones</TableHead>
                  <TableHead className="px-3 text-right font-medium">Relevantes</TableHead>
                  <TableHead className="px-3 text-right font-medium">Negativas</TableHead>
                  <TableHead className="px-3 text-right font-medium">Intención de compra</TableHead>
                  <TableHead className="px-4 font-medium">Participación de voz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voice.data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay menciones de candidatos o temas en este periodo.</TableCell></TableRow>
                ) : (
                  voice.data.slice(0, 8).map((row) => (
                    <TableRow key={row.keyword.id} className="hover:bg-muted/50">
                      <TableCell className="px-4 py-2.5">
                        <Link href={`/keywords/${row.keyword.id}`} className="font-mono text-foreground hover:underline">{row.keyword.term}</Link>
                        <Badge tone="outline" className="ml-2 font-normal text-muted-foreground">{tagName(row.keyword.kind)}</Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono">{compact(row.matched)}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono">
                        {compact(row.relevant)} <span className="text-[11px] text-muted-foreground">{row.matched ? `${Math.round((row.relevant / row.matched) * 100)}%` : ''}</span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono">{compact(row.negative)}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono">{compact(row.buyIntent)}</TableCell>
                      <TableCell className="px-4 py-2.5">
                        {row.keyword.kind === 'topic' ? (
                          <span className="text-xs text-muted-foreground">Tema</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <span className="block h-full rounded-full" style={{ width: `${Math.round(row.share ?? 0)}%`, background: row.keyword.kind === 'brand' ? 'var(--primary)' : '#f97316' }} />
                            </span>
                            <span className="font-mono text-xs">{Math.round(row.share ?? 0)}%</span>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <Card title="Intenciones" description="Lo que busca el electorado en la conversación." actions={<Link href="/analytics" className="text-primary hover:underline">Ver análisis ›</Link>}>
          <BarList
            items={intents.data.slice(0, 7).map((row) => ({ label: tagName(row.key), value: row.matched, href: `/mentions?intents=${encodeURIComponent(row.key)}` }))}
          />
        </Card>
      </section>

      <section>
        <div className="mb-2.5 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-semibold">Prioridad de respuesta</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Menciones relevantes aún abiertas, ordenadas por urgencia.</p>
          </div>
          <LinkButton href="/mentions?relevant=true&status=open&sort=priority" size="sm">Ver menciones abiertas</LinkButton>
        </div>
        {open.data.length === 0 ? (
          <EmptyState icon={CircleCheck} title="Todo al día.">
            Las nuevas menciones relevantes de la campaña aparecerán aquí. <Link href="/keywords/new" className="text-primary hover:underline">Monitorear otro candidato o tema</Link>
          </EmptyState>
        ) : (
          <MentionTable mentions={open.data} />
        )}
      </section>
    </div>
  );
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
