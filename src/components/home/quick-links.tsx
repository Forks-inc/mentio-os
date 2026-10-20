import { ArrowRight, FileText, Map, Megaphone, Swords } from 'lucide-react';
import Link from 'next/link';

const links = [
  { href: '/contienda', title: 'Cara a cara', description: 'Compara a tu candidato con sus adversarios.', icon: Swords, color: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  { href: '/temas', title: 'Temas', description: 'Descubre qué asuntos mueven la conversación.', icon: Map, color: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  { href: '/voceros', title: 'Voceros', description: 'Ubica a las personas que amplifican cada tema.', icon: Megaphone, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { href: '/reporte', title: 'Reporte ejecutivo', description: 'Consulta los hallazgos clave de la campaña.', icon: FileText, color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
];

export function QuickLinks() {
  return (
    <section aria-labelledby="home-tools-title" className="space-y-3">
      <div>
        <h2 id="home-tools-title" className="text-base font-semibold">Explora tu campaña</h2>
        <p className="mt-1 text-sm text-muted-foreground">Abre un resumen visual para entender mejor lo que está pasando.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 @4xl:grid-cols-4">
        {links.map(({ href, title, description, icon: Icon, color }) => (
          <Link key={href} href={href} className="group flex min-h-28 items-start gap-3 rounded-xl border border-border/75 bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon aria-hidden className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2 font-medium">
                <span>{title}</span><ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
