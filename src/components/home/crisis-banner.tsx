import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import type { Mention } from '@mentio-dev/sdk';
import { LinkButton } from '@/components/ui';

const number = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 });

export function CrisisBanner({ mentions, href, candidateCount, candidateNames }: { mentions: Mention[]; href: string; candidateCount: number; candidateNames: Record<string, string> }) {
  return (
    <section role="alert" aria-labelledby="crisis-title" className="rounded-xl border border-destructive/35 bg-destructive/5 p-4 ring-1 ring-destructive/10 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 id="crisis-title" className="text-base font-semibold text-destructive">Posible crisis</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {candidateCount === 1 ? 'Un candidato' : `${candidateCount} candidatos`} tuvo un aumento fuerte de menciones negativas. Revisa lo que está diciendo la gente.
            </p>
          </div>
        </div>
        <LinkButton href={href} size="sm" variant="danger">Ver negativas <ArrowUpRight aria-hidden className="ml-1 size-4" /></LinkButton>
      </div>

      {mentions.length ? (
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 @5xl:grid-cols-5" aria-label="Menciones negativas con mayor alcance">
          {mentions.map((mention) => {
            const author = mention.author?.name ?? mention.author?.handle ?? 'Autor sin identificar';
            const followers = mention.author?.followers;
            const candidateName = candidateNames[mention.keyword.id] ?? mention.keyword.term;
            return (
              <li key={mention.id} className="min-w-0 rounded-lg border border-destructive/15 bg-background/75 p-3">
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="truncate font-medium text-foreground">{candidateName}</span>
                  <span className="shrink-0">{followers === null || followers === undefined ? 'Alcance sin dato' : `${number.format(followers)} seguidores`}</span>
                </div>
                <a href={mention.post.url} target="_blank" rel="noreferrer" className="mt-2 block text-xs leading-relaxed text-foreground hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive">
                  <span className="font-medium">{author}:</span> {mention.post.text}
                </a>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-destructive/25 px-3 py-4 text-sm text-muted-foreground">
          La alerta se activó, pero todavía no hay publicaciones negativas visibles para mostrar.
        </p>
      )}
    </section>
  );
}
