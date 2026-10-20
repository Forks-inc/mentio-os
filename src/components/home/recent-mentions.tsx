import { ArrowUpRight, Heart, MessageCircleWarning } from 'lucide-react';
import type { Mention } from '@mentio-dev/sdk';
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, LinkButton } from '@/components/ui';
import { compact, platformName } from '@/lib/format';

const dateTime = new Intl.DateTimeFormat('es-MX', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chihuahua' });

export function RecentMentions({ title, mentions, tone }: { title: string; mentions: Mention[]; tone: 'positive' | 'negative' }) {
  const PositiveIcon = tone === 'positive' ? Heart : MessageCircleWarning;
  const accent = tone === 'positive' ? 'border-l-emerald-500' : 'border-l-rose-500';

  return (
    <ShadcnCard className={`min-w-0 border-l-[3px] ${accent}`}>
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <PositiveIcon aria-hidden className={`size-4 ${tone === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`} />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Cinco publicaciones recientes sobre tu candidato.</p>
      </CardHeader>
      <CardContent className="pt-1">
        {mentions.length ? (
          <ul className="divide-y divide-border/60">
            {mentions.slice(0, 5).map((mention) => {
              const author = mention.author?.name ?? mention.author?.handle ?? 'Autor sin identificar';
              const followers = mention.author?.followers;
              const published = new Date(mention.post.publishedAt);
              const when = Number.isNaN(published.getTime()) ? '' : dateTime.format(published);
              return (
                <li key={mention.id} className="py-3 first:pt-3 last:pb-2">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold" title={author}>{author}</p>
                      {mention.author?.handle && mention.author.name ? <p className="truncate text-[11px] text-muted-foreground">{mention.author.handle}</p> : null}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{when}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/85">{mention.post.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span>{platformName(mention.post.platform)}</span>
                    <span>Alcance {followers === null || followers === undefined ? 'sin dato' : `${compact(followers)} seguidores`}</span>
                    <a href={mention.post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      Ver publicación <ArrowUpRight aria-hidden className="size-3" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState compact title={tone === 'positive' ? 'Aún no hay menciones favorables' : 'No hay críticas recientes'} action={<LinkButton href="/keywords/new" variant="secondary" size="sm">Revisar monitoreo</LinkButton>}>
            Cuando aparezcan publicaciones sobre tu candidato, aquí podrás abrirlas y revisar quién las compartió.
          </EmptyState>
        )}
      </CardContent>
    </ShadcnCard>
  );
}
