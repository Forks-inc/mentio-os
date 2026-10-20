'use client';

import { useRouter } from 'next/navigation';
import { ChartContainer } from '@/components/ui/chart';
import { compact } from '@/lib/format';
import type { KeyboardEvent } from 'react';
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type ScatterShapeProps,
} from 'recharts';

export type ThemeBubble = {
  id: string;
  name: string;
  matched: number;
  sentimentScore: number | null;
  href: string;
};

function mixColor(from: string, to: string, amount: number) {
  const start = from.match(/[a-f\d]{2}/gi)?.map((part) => Number.parseInt(part, 16)) ?? [128, 128, 128];
  const end = to.match(/[a-f\d]{2}/gi)?.map((part) => Number.parseInt(part, 16)) ?? [128, 128, 128];
  const channels = start.map((value, index) => Math.round(value + ((end[index] ?? value) - value) * amount));
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function toneColor(score: number | null) {
  if (score === null) return '#a1a1aa';
  const bounded = Math.max(-1, Math.min(1, score));
  return bounded <= 0
    ? mixColor('#dc2626', '#a1a1aa', bounded + 1)
    : mixColor('#a1a1aa', '#16a34a', bounded);
}

function toneText(score: number | null) {
  if (score === null) return 'Aún no hay menciones con tono identificado.';
  if (score >= 0.15) return 'El tono se inclina a positivo.';
  if (score <= -0.15) return 'El tono se inclina a negativo.';
  return 'El tono está equilibrado entre positivo y negativo.';
}

export function ThemeBubbleChart({ topics }: { topics: ThemeBubble[] }) {
  const router = useRouter();
  const maxVolume = Math.max(1, ...topics.map((topic) => topic.matched));
  const chartPoints = topics.map((topic) => ({ ...topic, plotScore: topic.sentimentScore ?? 0 }));

  const renderBubble = (props: ScatterShapeProps) => {
    const topic = props.payload as ThemeBubble | undefined;
    if (!topic || props.cx === undefined || props.cy === undefined) return <g />;
    const radius = Math.max(5, Math.sqrt(props.size) / 2);
    const openTopic = () => router.push(topic.href);
    const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openTopic();
      }
    };
    return (
      <g
        role="link"
        tabIndex={0}
        aria-label={`Ver menciones del tema ${topic.name}`}
        className="cursor-pointer outline-none focus-visible:opacity-70"
        onClick={openTopic}
        onKeyDown={handleKeyDown}
      >
        <circle
          cx={props.cx}
          cy={props.cy}
          r={radius}
          fill={toneColor(topic.sentimentScore)}
          fillOpacity={0.84}
          stroke="var(--background)"
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <ChartContainer
      config={{ volume: { label: 'Menciones', color: 'var(--chart-1)' } }}
      className="aspect-auto w-full"
      style={{ height: 390 }}
    >
      <ScatterChart margin={{ top: 12, right: 14, bottom: 28, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="matched"
          domain={[0, maxVolume]}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          name="Menciones"
          label={{ value: 'Menciones en los últimos 30 días', position: 'insideBottom', offset: -18, fill: 'var(--muted-foreground)', fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="plotScore"
          domain={[-1, 1]}
          tickFormatter={(value) => Number(value) <= -0.15 ? 'Negativo' : Number(value) >= 0.15 ? 'Positivo' : 'Parejo'}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={62}
          name="Tono"
        />
        <ZAxis type="number" dataKey="matched" domain={[0, maxVolume]} range={[90, 900]} name="Menciones" />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            const topic = payload?.[0]?.payload as ThemeBubble | undefined;
            if (!active || !topic) return null;
            return (
              <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                <p className="font-medium">{topic.name}</p>
                <p>{compact(topic.matched)} menciones en 30 días</p>
                <p>{toneText(topic.sentimentScore)}</p>
                <p className="mt-1 text-muted-foreground">Selecciona la burbuja para leerlas.</p>
              </div>
            );
          }}
        />
        <Scatter data={chartPoints} dataKey="matched" shape={renderBubble} isAnimationActive={false} />
      </ScatterChart>
    </ChartContainer>
  );
}
