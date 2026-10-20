import Link from 'next/link';
import { ArrowRight, Bell, ChartNoAxesColumnIncreasing, GitCompareArrows } from 'lucide-react';
import { Badge, Card, PageHeader } from '@/components/ui';
import { ActionForm } from '@/components/ui/client';
import { startCampaignAction } from './actions';
import { SetupWizard } from './setup-wizard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Arranque' };

const NEXT_STEPS = [
  { title: 'Configura tu alerta de crisis', description: 'Recibe un aviso inmediato cuando aparezcan menciones negativas.', href: '/alerts/plantillas', icon: Bell },
  { title: 'Revisa tu semáforo', description: 'Mira el tono y el volumen de la conversación sobre tu candidatura.', href: '/', icon: ChartNoAxesColumnIncreasing },
  { title: 'Compara contra adversarios', description: 'Explora el desempeño de tu candidatura frente a otras.', href: '/contienda', icon: GitCompareArrows },
];

export default async function Arranque({ searchParams }: { searchParams: Promise<{ completado?: string }> }) {
  const { completado } = await searchParams;

  if (completado === '1') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Tu tablero está listo" description="Ya puedes empezar a revisar lo que se dice de tu candidatura." />
        <div className="grid gap-3">
          {NEXT_STEPS.map(({ title, description, href, icon: Icon }, index) => (
            <Link key={href} href={href} className="group block rounded-xl bg-card ring-1 ring-foreground/10 transition hover:ring-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Card className="transition-colors group-hover:bg-muted/20">
                <div className="flex items-center gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium">{title}</h2>
                      <Badge tone="outline">{index + 1} de 3</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Prepara tu tablero" description="En tres pasos, reúne los nombres y temas que quieres seguir." />
      <ActionForm action={startCampaignAction}>
        <SetupWizard />
      </ActionForm>
    </div>
  );
}
