import { ArrowRight, Sparkles } from 'lucide-react';
import { LinkButton } from '@/components/ui';
import { Card as ShadcnCard, CardContent } from '@/components/ui/card';

export function NoBrandCard() {
  return (
    <ShadcnCard className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-0">
      <CardContent className="grid items-center gap-6 p-6 sm:p-8 @3xl:grid-cols-[1fr_auto] @3xl:p-10">
        <div className="max-w-2xl">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles aria-hidden className="size-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Empieza aquí</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Configura tu campaña en 3 pasos</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Agrega a tu candidato, define a quién quieres comparar y elige los temas que quieres seguir. Después verás aquí cómo va la conversación.
          </p>
          <LinkButton href="/arranque" variant="primary" className="mt-5">
            Abrir asistente <ArrowRight aria-hidden className="ml-1 size-4" />
          </LinkButton>
        </div>
        <div aria-hidden="true" className="hidden size-36 items-center justify-center rounded-full border border-primary/15 bg-primary/5 @3xl:flex">
          <div className="flex size-24 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-sm">
            <span className="text-4xl font-semibold">3</span>
          </div>
        </div>
      </CardContent>
    </ShadcnCard>
  );
}
