import Link from 'next/link';
import { Card, CheckboxGroup, Field, Input, PageHeader, Textarea, cx } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { isOneOf } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { one, type SearchParams } from '@/lib/params';
import { createEmailChannel, createSlackChannel, createWebhookChannel } from '../actions';
import { ACCOUNT_EVENTS, KINDS, KIND_LABELS, targetText, type ChannelKind } from '../kinds';
import { SecretForm } from '../secret-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Crear canal' };

const BLURBS: Record<ChannelKind, string> = {
  slack: 'Envía avisos a un canal del espacio de trabajo conectado en Slack.',
  email: 'Envía avisos a una lista de direcciones.',
  webhook: 'Envía datos JSON firmados a tu propio endpoint.',
  telegram: 'Envía mensajes a un chat o grupo de Telegram.',
};

export default async function NewChannel({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const requested = one(params, 'type');
  const kind: ChannelKind = isOneOf(KINDS, requested) ? requested : 'webhook';

  return (
    <div className="space-y-6">
      <PageHeader title="Crear canal" description="Elige dónde recibir las alertas de campaña." back={{ href: '/channels', label: 'Canales' }} />

      <div className="grid gap-3 @lg:grid-cols-4">
        {KINDS.map((k, kIndex) => (
          <Link
            key={`${k}-${kIndex}`}
            href={`/channels/new?type=${k}`}
            className={cx('rounded-lg border bg-card p-4 text-sm', k === kind ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-zinc-400')}
          >
            <p className="font-medium">{KIND_LABELS[k]}</p>
            <p className="mt-1 text-xs text-muted-foreground">{BLURBS[k]}</p>
          </Link>
        ))}
      </div>

      {kind === 'slack' ? <SlackForm /> : null}
      {kind === 'email' ? <EmailForm /> : null}
      {kind === 'webhook' ? <WebhookForm /> : null}
      {kind === 'telegram' ? <TelegramInfo /> : null}
    </div>
  );
}

function SlackForm() {
  return (
    <Card title="Canal de Slack" description="Primero conecta tu espacio de trabajo de Slack desde el panel de administración. Para un canal privado, agrega la aplicación al canal.">
      <ActionForm action={createSlackChannel} className="space-y-4">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="ID del canal" hint="En Slack, abre los detalles del canal; el ID aparece en la parte inferior (C0123ABCD).">
            <Input name="channelId" required maxLength={40} placeholder="C0123ABCD" />
          </Field>
          <Field label="Nombre del canal" hint="Se usará como etiqueta.">
            <Input name="channelName" required maxLength={90} placeholder="#alertas-campana" />
          </Field>
        </div>
        <SubmitButton>Agregar canal de Slack</SubmitButton>
      </ActionForm>
    </Card>
  );
}

function EmailForm() {
  return (
    <Card title="Lista de correo" description="Cada dirección recibe un enlace de confirmación y no recibirá avisos hasta abrirlo. Las direcciones de miembros de tu espacio de trabajo se confirman de inmediato.">
      <ActionForm action={createEmailChannel} className="space-y-4">
        <Field label="Direcciones" hint="Hasta 20, una por línea o separadas por comas.">
          <Textarea name="emails" required rows={4} placeholder={'equipo@campana.mx\ncoordinacion@campana.mx'} />
        </Field>
        <SubmitButton>Agregar lista de correo</SubmitButton>
      </ActionForm>
    </Card>
  );
}

function WebhookForm() {
  return (
    <Card title="Webhook" description="Cada solicitud se firma con una clave secreta que se muestra una sola vez al crear el canal.">
      <SecretForm action={createWebhookChannel} className="space-y-4" title="Tu clave de firma" warning="Se muestra una sola vez. Úsala para verificar la firma v2: el valor HMAC-SHA256 hexadecimal de la marca de tiempo, un punto y el cuerpo original.">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="URL" hint="Destino de las solicitudes POST. Usa https.">
            <Input name="url" type="text" inputMode="url" required placeholder="https://ejemplo.mx/webhooks/campana" />
          </Field>
          <Field label="Etiqueta" hint="De forma predeterminada, se usa el dominio de la URL.">
            <Input name="label" maxLength={80} placeholder="Alertas de campaña" />
          </Field>
        </div>
        <Field label="Encabezados personalizados" hint={'Uno por línea con el formato "Nombre: valor", para tu autenticación.'}>
          <Textarea name="headers" rows={3} placeholder="Authorization: Bearer ..." className="font-mono" />
        </Field>
        <div>
          <p className="text-sm font-medium text-foreground">Eventos de la cuenta</p>
          <p className="mb-2 text-xs text-muted-foreground">Se envían directamente, sin una alerta. Las menciones y los resúmenes periódicos siguen llegando por medio de las alertas.</p>
          <CheckboxGroup name="events" options={ACCOUNT_EVENTS.map(([id, label]) => [id, `${label} (${id})`] as const)} selected={[]} />
        </div>
        <SubmitButton>Crear webhook</SubmitButton>
      </SecretForm>
    </Card>
  );
}

async function TelegramInfo() {
  const telegram = unwrap(await mentio().listChannels()).data.filter((c) => c.kind === 'telegram');
  return (
    <Card title="Telegram" description="Los chats de Telegram se conectan desde el panel de administración, no mediante la API.">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground/80">
        <li>Abre el panel de administración y conecta Telegram.</li>
        <li>Sigue el enlace que aparece y pulsa Iniciar, o agrega el bot a un grupo.</li>
        <li>El chat aparecerá aquí como un canal. Selecciónalo en una alerta.</li>
      </ol>
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">Chats conectados</p>
        {telegram.length ? (
          <ul className="divide-y divide-line rounded-md border border-line text-sm">
            {telegram.map((c) => (
              <li key={c.id} className="flex justify-between gap-3 px-3 py-2">
                <Link href={`/channels/${c.id}`} className="font-medium hover:underline">{c.label}</Link>
                <span className="text-xs text-muted-foreground">{targetText(c)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay chats conectados.</p>
        )}
      </div>
    </Card>
  );
}
