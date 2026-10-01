import { Badge, Card, CheckboxGroup, Field, Input, PageHeader, Stat, Table, Textarea, td, type Tone, TableCell, TableRow } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { date, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { deleteChannelAction, rotateSecretAction, testChannelAction, updateChannelAction } from '../actions';
import { ACCOUNT_EVENTS, KIND_LABELS, headersText, targetText } from '../kinds';
import { SecretForm } from '../secret-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Channel' };

const STATUS_TONE: Record<'pending' | 'delivered' | 'failed', Tone> = { pending: 'warn', delivered: 'good', failed: 'bad' };

/** One channel: edit it, test it, rotate a webhook's secret, and read what it delivered. */
export default async function ChannelDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = mentio();
  const [channel, deliveries] = await Promise.all([
    api.getChannel({ path: { id } }).then(unwrap),
    api.listChannelDeliveries({ path: { id }, query: { limit: 50 } }).then(unwrap),
  ]);
  const hidden = <input type="hidden" name="id" value={channel.id} />;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/channels', label: 'Channels' }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {channel.label}
            <Badge tone="outline">{KIND_LABELS[channel.kind]}</Badge>
          </span>
        }
        description={targetText(channel)}
        actions={
          <ActionForm action={testChannelAction}>
            {hidden}
            <SubmitButton variant="secondary">Send a test</SubmitButton>
          </ActionForm>
        }
      />

      <div className="grid gap-3 @lg:grid-cols-3">
        <Stat label="Alerts sending here" value={`${channel.stats.activeAlerts} of ${channel.stats.alerts}`} hint={channel.stats.activeAlerts === 0 ? 'None enabled: it receives nothing now' : 'Enabled of total'} />
        <Stat label="Deliveries, last 7 days" value={channel.stats.last7d.total} hint={channel.stats.last7d.failed ? `${channel.stats.last7d.failed} failed` : 'None failed'} />
        <Stat label="Last delivery" value={channel.stats.lastDeliveryAt ? timeAgo(channel.stats.lastDeliveryAt) : 'Never'} hint={date(channel.stats.lastDeliveryAt)} />
      </div>

      {channel.kind === 'email' ? (
        <Card title="Recipients" description="Unconfirmed addresses receive nothing until they click the link they were sent.">
          <ul className="divide-y divide-line text-sm">
            {channel.config.recipients.map((r) => (
              <li key={r.email} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate">{r.email}</span>
                {r.confirmedAt ? <Badge tone="good">Confirmed {timeAgo(r.confirmedAt)}</Badge> : <Badge tone="warn">Awaiting confirmation</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Settings">
        <ActionForm action={updateChannelAction} className="space-y-4">
          {hidden}
          <input type="hidden" name="kind" value={channel.kind} />
          <Field label="Label">
            <Input name="label" required maxLength={80} defaultValue={channel.label} />
          </Field>
          {channel.kind === 'webhook' ? (
            <>
              <Field label="URL">
                <Input name="url" type="text" inputMode="url" required defaultValue={channel.config.url} />
              </Field>
              <Field label="Custom headers" hint={'One per line as "Name: value". Saving replaces the whole set.'}>
                <Textarea name="headers" rows={3} defaultValue={headersText(channel.config.headers)} className="font-mono" />
              </Field>
              <div>
                <p className="text-sm font-medium text-foreground">Account events</p>
                <p className="mb-2 text-xs text-muted-foreground">Keyword and wallet changes sent here with no alert involved. Uncheck all to receive none.</p>
                <CheckboxGroup name="events" options={ACCOUNT_EVENTS.map(([eid, label]) => [eid, `${label} (${eid})`] as const)} selected={channel.config.events} />
              </div>
            </>
          ) : null}
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
      </Card>

      {channel.kind === 'webhook' ? (
        <Card title="Signing secret" description="Rotating returns a new secret once. The old one stops working at once, so update your endpoint right away.">
          <SecretForm action={rotateSecretAction} title="Your new signing secret">
            {hidden}
            <SubmitButton variant="secondary" confirm="Rotate the secret? The current one stops working at once.">Rotate secret</SubmitButton>
          </SecretForm>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Delivery log</h2>
        <Table head={['Status', 'Event', 'What', 'Attempts', 'Time']} empty={deliveries.data.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Nothing delivered yet.</p> : null}>
          {deliveries.data.map((d) => (
            <TableRow key={d.id}>
              <TableCell className={`${td} whitespace-nowrap`}>
                <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
              </TableCell>
              <TableCell className={`${td} font-mono text-xs whitespace-nowrap`}>{d.event}</TableCell>
              <TableCell className={`${td} min-w-56 text-xs`}>
                {d.alert.name ? <p className="font-medium">{d.alert.name}</p> : null}
                {d.mention ? (
                  <a href={d.mention.url} target="_blank" rel="noreferrer" className="line-clamp-2 text-muted-foreground hover:underline">{d.mention.text}</a>
                ) : (
                  <p className="text-muted-foreground">{d.kind === 'digest' ? 'Digest' : d.kind === 'event' ? 'Account event' : 'Mention'}</p>
                )}
                {d.error ? <p className="mt-1 text-red-600">{d.error}</p> : null}
              </TableCell>
              <TableCell className={`${td} text-xs tabular-nums`}>{d.attempts}</TableCell>
              <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`} title={date(d.sentAt ?? d.createdAt)}>{timeAgo(d.sentAt ?? d.createdAt)}</TableCell>
            </TableRow>
          ))}
        </Table>
      </section>

      <Card title="Delete channel" description="Alerts stop sending here. The alerts themselves stay.">
        <ActionForm action={deleteChannelAction}>
          {hidden}
          <SubmitButton variant="danger" confirm={`Delete the channel "${channel.label}"?`}>Delete channel</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
