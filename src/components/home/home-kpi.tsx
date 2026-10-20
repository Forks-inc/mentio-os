import type { ReactNode } from 'react';
import { Sparkline } from '@/components/charts';
import { Card as ShadcnCard, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

export type KpiChange = { label: string; tone: 'good' | 'bad' | 'muted' };

const changeTone = {
  good: 'text-emerald-700 dark:text-emerald-400',
  bad: 'text-rose-700 dark:text-rose-400',
  muted: 'text-muted-foreground',
} as const;

export function HomeKpi({
  label,
  value,
  change,
  spark,
  valueClassName,
  sparkTone = 'accent',
  hint,
}: {
  label: string;
  value: ReactNode;
  change: KpiChange | null;
  spark: number[];
  valueClassName?: string;
  sparkTone?: 'accent' | 'bad';
  hint?: string;
}) {
  return (
    <ShadcnCard className="min-w-0 gap-3 bg-gradient-to-b from-card to-muted/25 py-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardDescription className="text-xs font-medium leading-snug text-muted-foreground">{label}</CardDescription>
        {change ? <span title="Cambio frente al periodo anterior" className={`shrink-0 text-[11px] font-semibold tabular-nums ${changeTone[change.tone]}`}>{change.label}</span> : <span className="text-[10px] text-muted-foreground">Sin base previa</span>}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <span className={`min-w-0 truncate text-2xl font-semibold tracking-tight tabular-nums @xl/home:text-[1.75rem] ${valueClassName ?? ''}`}>{value}</span>
          {spark.length > 1 ? <Sparkline values={spark} tone={sparkTone} className="h-8 w-[4.5rem]" /> : <span aria-hidden className="h-8 w-[4.5rem]" />}
        </div>
        {hint ? <p className="mt-1 truncate text-[10px] text-muted-foreground">{hint}</p> : <p className="mt-1 text-[10px] text-muted-foreground">vs. periodo anterior</p>}
      </CardContent>
    </ShadcnCard>
  );
}
