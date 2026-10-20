import Link from 'next/link';
import { Webhook, Plus } from 'lucide-react';
import { Badge, EmptyState, LinkButton, PageHeader, Table, td, TableCell, TableRow, rowLink } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { KINDS, KIND_LABELS, targetText } from './kinds';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Canales' };

/** Where alerts go, by type, with how each one has been doing this week. */
export default async function Channels() {
  const channels = unwrap(await mentio().listChannels()).data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Canales"
        description="Canales de Slack, listas de correo, webhooks y chats de Telegram donde se envían las alertas de campaña."
        actions={<LinkButton href="/channels/new" variant="primary" create><Plus /> Crear canal</LinkButton>}
      />

      {channels.length === 0 ? (
        <EmptyState icon={Webhook} title="Aún no hay canales">
          <Link href="/channels/new" className="text-primary hover:underline">Agrega uno</Link> y selecciónalo en una alerta.
        </EmptyState>
      ) : (
        KINDS.map((kind) => {
          const rows = channels.filter((c) => c.kind === kind);
          if (rows.length === 0) return null;
          return (
            <section key={kind}>
              <h2 className="mb-2 text-sm font-semibold">{KIND_LABELS[kind]}</h2>
              <Table head={['Canal', 'Destino', 'Alertas', 'Últimos 7 días', 'Último envío']}>
                {rows.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className={td}>
                      <Link href={`/channels/${channel.id}`} data-row-link className={`font-medium hover:underline ${rowLink}`}>{channel.label}</Link>
                    </TableCell>
                    <TableCell className={`${td} max-w-72 truncate text-xs text-muted-foreground`} title={targetText(channel)}>
                      {targetText(channel)}
                      {channel.kind === 'email' && channel.config.recipients.some((r) => !r.confirmedAt) ? (
                        <Badge tone="warn" className="ml-2">Falta confirmar</Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className={`${td} text-xs whitespace-nowrap`}>
                      {channel.stats.activeAlerts} activas de {channel.stats.alerts}
                      {channel.stats.activeAlerts === 0 ? <p className="text-amber-700">No recibe avisos</p> : null}
                    </TableCell>
                    <TableCell className={`${td} text-xs whitespace-nowrap`}>
                      {channel.stats.last7d.total} envíos
                      {channel.stats.last7d.failed ? <Badge tone="bad" className="ml-2">{channel.stats.last7d.failed} fallidos</Badge> : null}
                    </TableCell>
                    <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`}>{timeAgo(channel.stats.lastDeliveryAt) || 'Nunca'}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </section>
          );
        })
      )}
    </div>
  );
}
