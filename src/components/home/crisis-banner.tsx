import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import { LinkButton } from '@/components/ui';

export function CrisisBanner({ candidateName, negativeMentions, growth, href }: { candidateName: string; negativeMentions: number; growth: number | null; href: string }) {
  const change = growth === null ? 'subieron con fuerza' : `subieron ${Math.round(growth)}%`;

  return (
    <section role="alert" aria-label="Señal de posible crisis" className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-rose-300/70 bg-rose-50/80 px-3 py-2.5 text-rose-950 dark:border-rose-900/70 dark:bg-rose-950/25 dark:text-rose-100">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-200"><TriangleAlert aria-hidden className="size-4" /></span>
      <p className="min-w-0 flex-1 truncate text-xs sm:text-sm">
        <strong>Posible crisis</strong><span className="mx-1.5 text-rose-600/70 dark:text-rose-300/70">·</span>
        <strong>{candidateName}</strong>: las menciones negativas {change} frente al periodo anterior ({new Intl.NumberFormat('es-MX').format(negativeMentions)} en este periodo).
      </p>
      <LinkButton href={href} size="sm" variant="danger" className="ml-auto h-8 shrink-0 px-2.5 text-xs">
        Ver qué pasó <ArrowUpRight aria-hidden className="ml-1 size-3.5" />
      </LinkButton>
    </section>
  );
}
