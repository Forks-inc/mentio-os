import Link from 'next/link';
import { ArrowRight, BellRing, CalendarClock, GitCompareArrows, Plus } from 'lucide-react';
import type { Channel } from '@mentio-dev/sdk';
import { Badge, Card, Field, PageHeader, Select } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { LinkButton } from '@/components/ui';
import { mentio, unwrap } from '@/lib/mentio';
import { createTemplateAlertAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Plantillas de alerta' };

const CHANNEL_KIND: Record<Channel['kind'], string> = { slack: 'Slack', email: 'Correo', webhook: 'Webhook', telegram: 'Telegram' };

type TemplateProps = {
  id: 'crisis' | 'daily' | 'competitors';
  title: string;
  description: string;
  detail: string;
  icon: typeof BellRing;
  channels: Channel[];
  hasCompetitors?: boolean;
};

function TemplateCard({ id, title, description, detail, icon: Icon, channels, hasCompetitors = true }: TemplateProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{title}</h2>
              <Badge tone={id === 'crisis' ? 'bad' : id === 'daily' ? 'accent' : 'outline'}>{id === 'daily' ? 'Diaria' : 'Inmediata'}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <p className="min-h-10 rounded-lg bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>

        {channels.length === 0 ? (
          <div className="mt-auto border-t pt-4">
            <p className="mb-3 text-sm text-muted-foreground">Conecta un canal antes de crear la alerta.</p>
            <LinkButton href="/channels/new" variant="primary"><Plus aria-hidden="true" /> Crear canal</LinkButton>
          </div>
        ) : id === 'competitors' && !hasCompetitors ? (
          <div className="mt-auto border-t pt-4">
            <p className="mb-3 text-sm text-muted-foreground">Primero registra a quién quieres comparar.</p>
            <LinkButton href="/arranque" variant="primary">Agregar adversarios <ArrowRight aria-hidden="true" /></LinkButton>
          </div>
        ) : (
          <ActionForm action={createTemplateAlertAction} className="mt-auto grid gap-3 border-t pt-4">
            <input type="hidden" name="template" value={id} />
            <Field label="Canal de envío">
              <Select
                name="channelId"
                required
                placeholder="Elige un canal"
                options={channels.map((channel) => [channel.id, `${channel.label} · ${CHANNEL_KIND[channel.kind]}`] as const)}
              />
            </Field>
            <div className="flex justify-end">
              <SubmitButton>Usar esta plantilla</SubmitButton>
            </div>
          </ActionForm>
        )}
      </div>
    </Card>
  );
}

export default async function AlertTemplates() {
  const [channelResponse, competitorResponse] = await Promise.all([
    mentio().listChannels().then(unwrap),
    mentio().listKeywords({ query: { kind: ['competitor'] } }).then(unwrap),
  ]);
  const channels = channelResponse.data;
  const hasCompetitors = competitorResponse.data.length > 0;

  return (
    <div>
      <PageHeader
        title="Plantillas de alerta"
        description="Elige una regla sencilla y el canal donde quieres recibirla."
        back={{ href: '/alerts', label: 'Alertas' }}
        actions={<LinkButton href="/channels/new" variant="secondary"><Plus aria-hidden="true" /> Crear canal</LinkButton>}
      />
      <div className="grid gap-4 @4xl:grid-cols-3">
        <TemplateCard
          id="crisis"
          title="Avísame si hay crisis"
          description="Recibe un aviso inmediato por cada mención clasificada como negativa."
          detail="La regla usa el filtro de sentimiento negativo de la API; el semáforo resume el estado general en el tablero."
          icon={BellRing}
          channels={channels}
        />
        <TemplateCard
          id="daily"
          title="Resumen diario a las 8am"
          description="Un resumen cada día con las menciones relevantes que coincidan."
          detail="Se enviará a las 8:00 a. m., hora de Chihuahua. Si no hay menciones, no se enviará un mensaje vacío."
          icon={CalendarClock}
          channels={channels}
        />
        <TemplateCard
          id="competitors"
          title="Menciones de adversarios"
          description="Recibe menciones que coincidan con los nombres registrados como adversarios."
          detail="La API permite filtrar por términos, pero no exigir que una misma publicación mencione a tu candidatura y a un adversario."
          icon={GitCompareArrows}
          channels={channels}
          hasCompetitors={hasCompetitors}
        />
      </div>
      {channels.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Aún no hay canales conectados. <Link href="/channels/new" className="text-primary hover:underline">Agrega uno para recibir tus alertas.</Link></p>
      ) : null}
    </div>
  );
}
