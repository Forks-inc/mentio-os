import { ArrowUpRight, Circle } from 'lucide-react';
import { Badge, LinkButton } from '@/components/ui';
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
  red: 'border-l-rose-600',
  gray: 'border-l-muted-foreground/40',
};

const statusText: Record<TrafficLightColor, string> = {
  green: 'text-emerald-600',
  yellow: 'text-amber-600',
  red: 'text-rose-600',
  gray: 'text-muted-foreground',
};

export function BrandInsightCard({ candidate, summary, previous, topic }: {
  candidate: CandidateGroup;
  summary: InsightSummary;
  previous: PreviousInsightSummary;
  topic?: string;
}) {
  const light = trafficLight(summary, previous);
  const focus = summary.sentiment.negative >= summary.sentiment.positive ? 'negative' : 'positive';
  const href = `/mentions?keywordIds=${encodeURIComponent(candidate.keywordIds.join(','))}&sentiments=${focus}`;

  return (
    <ShadcnCard className={`overflow-hidden border-l-4 ${statusBorder[light.color]} bg-gradient-to-br from-card via-card to-muted/35`}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Circle aria-hidden className="size-4 fill-current" /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pulso del candidato</p>
            <CardTitle className="mt-0.5 truncate text-lg font-semibold">{candidate.name}</CardTitle>
          </div>
        </div>
        <Badge tone={statusTone[light.color]} className={`shrink-0 px-2.5 py-1 text-xs ${statusText[light.color]}`}>{light.label}</Badge>
      </CardHeader>

      <CardContent className="grid items-center gap-5 pt-4 @container @xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.65fr)] @xl:gap-8">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Lectura rápida</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground sm:text-base">{plainSentence(summary, previous, topic)}</p>
          {topic ? <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" /> Tema que más conversa: <strong className="font-semibold text-foreground">{topic}</strong></p> : null}
          <div className="mt-4">
            <LinkButton href={href} variant="secondary" size="sm" aria-label={`Revisar menciones ${focus === 'negative' ? 'negativas' : 'positivas'} sobre ${candidate.name}`}>
              Revisar conversación <ArrowUpRight aria-hidden className="ml-1 size-4" />
            </LinkButton>
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/75 px-4 py-3">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tono de la conversación</p>
          <ToneMeter sentiment={summary.sentiment} id={candidate.mainId} />
        </div>
      </CardContent>
    </ShadcnCard>
  );
}
