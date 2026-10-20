import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Badge, LinkButton, Sparkline } from '@/components/ui';
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { plainSentence, trafficLight, type CandidateGroup, type InsightSummary, type PreviousInsightSummary, type TrafficLightColor } from '@/lib/insights';
import { ToneMeter } from './tone-meter';

const statusTone: Record<TrafficLightColor, 'good' | 'warn' | 'bad' | 'neutral'> = {
  green: 'good',
  yellow: 'warn',
  red: 'bad',
  gray: 'neutral',
};

const statusBorder: Record<TrafficLightColor, string> = {
  green: 'border-l-emerald-500',
  yellow: 'border-l-amber-500',
  red: 'border-l-destructive',
  gray: 'border-l-muted-foreground/40',
};

const statusDark: Record<TrafficLightColor, string> = {
  green: 'dark:bg-emerald-950 dark:text-emerald-300',
  yellow: 'dark:bg-amber-950 dark:text-amber-300',
  red: 'dark:bg-destructive dark:text-destructive-foreground',
  gray: 'dark:bg-muted dark:text-muted-foreground',
};

const number = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 });

export function BrandInsightCard({
  candidate,
  summary,
  previous,
  topic,
  series,
}: {
  candidate: CandidateGroup;
  summary: InsightSummary;
  previous: PreviousInsightSummary;
  topic?: string;
  series: Array<{ date: string; matched: number }>;
}) {
  const light = trafficLight(summary, previous);
  const focus = summary.sentiment.negative >= summary.sentiment.positive ? 'negative' : 'positive';
  const href = `/mentions?keywordIds=${encodeURIComponent(candidate.keywordIds.join(','))}&sentiments=${focus}`;

  return (
    <ShadcnCard className={`h-full gap-0 border-l-4 ${statusBorder[light.color]}`}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles aria-hidden className="size-4" /></span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Tu candidato</p>
            <CardTitle className="truncate text-lg font-semibold">{candidate.name}</CardTitle>
          </div>
        </div>
        <Badge tone={statusTone[light.color]} className={`shrink-0 px-2.5 py-1 text-xs ${statusDark[light.color]}`}>{light.label}</Badge>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        <p className="max-w-3xl text-sm leading-relaxed text-foreground">{plainSentence(summary, previous, topic)}</p>

        <div className="grid items-center gap-5 @md:grid-cols-2">
          <section aria-label="Tono de la conversación" className="rounded-lg bg-muted/35 px-3 pt-2 pb-3">
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">Tono de la conversación</h3>
            <ToneMeter sentiment={summary.sentiment} id={candidate.mainId} />
          </section>
          <section aria-label="Menciones de los últimos siete días" className="rounded-lg bg-muted/35 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium text-muted-foreground">Últimos 7 días</h3>
              <span className="text-xs tabular-nums text-foreground">{number.format(series.reduce((total, point) => total + point.matched, 0))} menciones</span>
            </div>
            {series.length > 1 ? (
              <div className="mt-3" aria-label="Tendencia diaria de menciones">
                <Sparkline values={series.map((point) => point.matched)} className="h-12 w-full" />
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Aún no hay tendencia para mostrar.</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>{number.format(summary.sentiment.positive)} positivas</span>
              <span>{number.format(summary.sentiment.negative)} negativas</span>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">La tarjeta resume los últimos 30 días y compara con los 30 días anteriores.</p>
          <LinkButton href={href} variant="primary" size="sm" aria-label={`Ver las menciones ${focus === 'negative' ? 'negativas' : 'positivas'} sobre ${candidate.name}`}>
            Ver qué lo causó <ArrowUpRight aria-hidden className="ml-1 size-4" />
          </LinkButton>
        </div>
      </CardContent>
    </ShadcnCard>
  );
}
