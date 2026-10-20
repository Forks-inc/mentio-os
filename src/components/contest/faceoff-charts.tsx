'use client';

import { ChartContainer } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { compact } from '@/lib/format';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type FaceoffKeyword = {
  id: string;
  label: string;
  share: number;
  matched: number;
  tone: {
    positive: number;
    neutral: number;
    negative: number;
    unclassified: number;
  };
};

type SentimentRow = FaceoffKeyword['tone'] & { label: string; matched: number };

const SENTIMENT_NAMES = {
  positive: 'Positivo',
  neutral: 'Neutral',
  negative: 'Negativo',
} as const;

function VoiceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: FaceoffKeyword }> }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{row.label}</p>
      <p>{row.share.toFixed(1)}% de participación · {compact(row.matched)} menciones</p>
    </div>
  );
}

function ToneTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: SentimentRow }> }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const classified = row.positive + row.neutral + row.negative;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{row.label}</p>
      <p>{compact(row.positive)} positivas · {compact(row.neutral)} neutrales · {compact(row.negative)} negativas</p>
      {row.unclassified ? <p className="text-muted-foreground">{compact(row.unclassified)} aún sin tono</p> : null}
      {!classified ? <p className="text-muted-foreground">Sin menciones con tono identificado.</p> : null}
    </div>
  );
}

function ToneLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Leyenda de tono">
      {Object.entries(SENTIMENT_NAMES).map(([key, label]) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={`size-2 rounded-full ${key === 'positive' ? 'bg-emerald-500' : key === 'neutral' ? 'bg-zinc-400' : 'bg-red-500'}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

function ComparePanel({ title, description, rows, color }: {
  title: string;
  description: string;
  rows: FaceoffKeyword[];
  color: string;
}) {
  const toneRows: SentimentRow[] = rows.map((row) => ({ ...row.tone, label: row.label, matched: row.matched }));
  const voiceHeight = Math.max(88, rows.length * 36 + 16);
  const toneHeight = Math.max(104, rows.length * 37 + 40);
  const shareTotal = rows.reduce((sum, row) => sum + row.share, 0);
  const mentionTotal = rows.reduce((sum, row) => sum + row.matched, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b pb-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{shareTotal.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">participación de voz · {compact(mentionTotal)} menciones</p>
          </div>
          <ToneLegend />
        </div>

        <div className="space-y-5">
        <section aria-label={`Participación de voz: ${title}`}>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Participación de voz por término</h3>
          {rows.length ? (
            <ChartContainer config={{ share: { label: 'Participación', color } }} className="w-full" style={{ height: voiceHeight }}>
              <BarChart data={rows} layout="vertical" margin={{ top: 2, right: 14, bottom: 2, left: 2 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={112}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.5 }} content={<VoiceTooltip />} />
                <Bar dataKey="share" fill="var(--color-share)" radius={[0, 5, 5, 0]} barSize={18} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="rounded-md bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">
              Sin menciones para este periodo.
            </p>
          )}
        </section>

        <section aria-label={`Tono de la conversación: ${title}`} className="border-t pt-4">
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Tono de las menciones por término</h3>
          {toneRows.length ? (
            <ChartContainer
              config={{
                positive: { label: SENTIMENT_NAMES.positive, color: '#16a34a' },
                neutral: { label: SENTIMENT_NAMES.neutral, color: '#a1a1aa' },
                negative: { label: SENTIMENT_NAMES.negative, color: '#ef4444' },
              }}
              className="w-full"
              style={{ height: toneHeight }}
            >
              <BarChart data={toneRows} layout="vertical" stackOffset="expand" margin={{ top: 2, right: 8, bottom: 2, left: 2 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(value) => `${Math.round(Number(value) * 100)}%`}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={112}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.5 }} content={<ToneTooltip />} />
                <Bar dataKey="positive" stackId="tone" fill="var(--color-positive)" barSize={18} />
                <Bar dataKey="neutral" stackId="tone" fill="var(--color-neutral)" />
                <Bar dataKey="negative" stackId="tone" fill="var(--color-negative)" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="rounded-md bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">
              El tono aparecerá cuando haya menciones clasificadas.
            </p>
          )}
        </section>
        </div>
      </CardContent>
    </Card>
  );
}

export function FaceoffCharts({ brand, competitors }: { brand: FaceoffKeyword[]; competitors: FaceoffKeyword[] }) {
  return (
    <section className="grid gap-4 @4xl:grid-cols-2">
      <ComparePanel
        title="Tu candidato"
        description="Menciones al candidato y sus apodos reunidas en una sola comparación."
        rows={brand}
        color="var(--primary)"
      />
      <ComparePanel
        title="Adversarios"
        description="Cada adversario incluye las menciones de sus apodos registrados."
        rows={competitors}
        color="#ef4444"
      />
    </section>
  );
}
