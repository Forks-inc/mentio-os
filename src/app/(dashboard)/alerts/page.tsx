import Link from 'next/link';
import { Bell, Plus } from 'lucide-react';
import { Badge, Conditions, EmptyState, LinkButton, PageHeader, Table, td, TableCell, TableRow, rowLink } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { compact, date, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { setAlertEnabled } from './actions';
import { loadRuleContext } from './names';
import { MODE_LABELS, describeFilter, whenText } from './rule';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Alerts' };

/** Every rule: what it watches, when and where it sends, and a switch to pause it. */
export default async function Alerts() {
  const [alerts, context] = await Promise.all([mentio().listAlerts().then(unwrap), loadRuleContext()]);

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Rules that send matching mentions to your channels, as they happen or as a digest."
        actions={<LinkButton href="/alerts/new" variant="primary" create><Plus /> New alert</LinkButton>}
      />

      {alerts.data.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts yet">
          <Link href="/alerts/new" className="text-primary hover:underline">Create one</Link> to get mentions in Slack, email, a webhook or Telegram.
        </EmptyState>
      ) : (
        <Table head={['Alert', 'Sends', 'Channels', 'Last 7 days', '']}>
          {alerts.data.map((alert) => (
            <TableRow key={alert.id} className={alert.enabled ? '' : 'text-muted-foreground'}>
              <TableCell className={`${td} min-w-64`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/alerts/${alert.id}`} data-row-link className={`font-medium hover:underline ${rowLink}`}>{alert.name}</Link>
                  <Badge tone={alert.mode === 'instant' ? 'accent' : 'outline'}>{MODE_LABELS[alert.mode]}</Badge>
                  {alert.enabled ? null : <Badge>Disabled</Badge>}
                </div>
                <div className="mt-1.5">
                  <Conditions conditions={describeFilter(alert.filter, context.names)} empty="Every relevant mention" />
                </div>
              </TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground`}>
                {whenText(alert)}
                {alert.stats.nextRunAt && alert.enabled ? <p className="text-muted-foreground">Next {date(alert.stats.nextRunAt)}</p> : null}
              </TableCell>
              <TableCell className={td}>
                <div className="flex flex-wrap gap-1">
                  {alert.channels.length ? alert.channels.map((c) => <Badge key={c.id} tone="outline">{c.label}</Badge>) : <span className="text-xs text-amber-700">No channel</span>}
                </div>
              </TableCell>
              <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`}>
                <span className="tabular-nums">{compact(alert.stats.sentLast7d)}</span> sent
                {alert.stats.lastSentAt ? <p className="text-muted-foreground">last {timeAgo(alert.stats.lastSentAt)}</p> : null}
              </TableCell>
              <TableCell className={`${td} text-right`}>
                <ActionForm action={setAlertEnabled}>
                  <input type="hidden" name="id" value={alert.id} />
                  <input type="hidden" name="enabled" value={String(!alert.enabled)} />
                  <SubmitButton size="sm" variant="secondary">{alert.enabled ? 'Disable' : 'Enable'}</SubmitButton>
                </ActionForm>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
