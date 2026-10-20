/** What the analytics page needs beyond the kit: the change label, the hour heatmap, the palette and the tabs. */
import type { AnalyticsBreakdown } from '@mentio-dev/sdk';
import type { ReactNode } from 'react';
import { ChartColumn } from 'lucide-react';
import { EmptyState, LinkButton } from '@/components/ui';
import { Tabs } from '@/components/ui/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CHART_COLORS } from '@/lib/chart-colors';
import { change } from './window';

export { ShareBar, Sparkline } from '@/components/charts';

/** "+12%" in green, "-8%" in red, against the previous window. */
export function Delta({ current, previous, invert = false, short = false }: { current: number; previous: number | null | undefined; invert?: boolean; short?: boolean }) {
  const pct = change(current, previous);
  if (pct === null) return null;
  if (pct === 0) return <span className="text-muted-foreground">Sin cambios</span>;
  const up = pct > 0;
  const good = invert ? !up : up;
  const text = pct === Infinity ? 'Nuevo' : `${up ? '+' : ''}${Math.round(pct)}%`;
  return (
    <span className={good ? 'text-emerald-600' : 'text-red-600'}>
      {text}{short ? null : <span className="text-muted-foreground"> frente al periodo anterior</span>}
    </span>
  );
}

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** by=hour as a weekday by hour grid; darker is busier. */
export function HourHeatmap({ rows }: { rows: AnalyticsBreakdown['data'] }) {
  const cells = new Map<string, number>();
  for (const row of rows) if (row.slot) cells.set(`${row.slot.weekday}-${row.slot.hour}`, row.matched);
  const max = Math.max(1, ...cells.values());
  if (cells.size === 0) return <EmptyState compact icon={ChartColumn} title="Aún no hay horarios con menciones" example="Cuando se publique una mención sobre “María López”, aquí verás los días y horas con más conversación." action={<LinkButton href="/keywords/new" variant="primary" size="sm">Agregar término</LinkButton>}>Este reporte ayuda a ubicar cuándo se conversa sobre los temas de la campaña.</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid min-w-full gap-0.5 text-[10px] text-muted-foreground" style={{ gridTemplateColumns: 'auto repeat(24, minmax(12px, 1fr))' }}>
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="text-center">{h % 6 === 0 ? h : ''}</span>
        ))}
        {ORDER.map((day, dayIndex) => (
          <HeatRow key={`${day}-${dayIndex}`} day={day} cells={cells} max={max} />
        ))}
      </div>
    </div>
  );
}

function HeatRow({ day, cells, max }: { day: number; cells: Map<string, number>; max: number }) {
  return (
    <>
      <span className="pr-1.5 leading-4">{WEEKDAYS[day]}</span>
      {Array.from({ length: 24 }, (_, hour) => {
        const n = cells.get(`${day}-${hour}`) ?? 0;
        return (
          <Tooltip key={hour}>
            <TooltipTrigger render={<span className="h-4 rounded-sm bg-primary" style={{ opacity: n === 0 ? 0.06 : 0.15 + (n / max) * 0.85 }} />} />
            <TooltipContent>{`${WEEKDAYS[day]} ${String(hour).padStart(2, '0')}:00 · ${n} menciones`}</TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}

/** A palette for categorical series (share of voice). */
export const PALETTE = [...CHART_COLORS, '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#71717a'];

/** Tabs driven by a search param, keeping the rest of the URL: the kit's shadcn Tabs. */
export function ParamTabs({ current, items }: { current: string; items: Array<{ value: string; label: ReactNode; href: string }> }) {
  return <Tabs current={current} items={items} />;
}
