import { Badge, Card, Field, LinkButton, PageHeader, Stat, Textarea } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { compact, date, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { deleteAlertAction, muteAuthorsAction, runDigestAction, testAlertAction, unmuteAuthorAction, updateAlertAction } from '../actions';
import { AlertForm } from '../alert-form';
import { loadRuleContext } from '../names';
import { MODE_LABELS, describeFilter, whenText } from '../rule';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Alert' };

/** One rule: edit it, try it, run its digest now, and keep its muted authors. */
export default async function AlertDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [alert, context] = await Promise.all([mentio().getAlert({ path: { id } }).then(unwrap), loadRuleContext()]);
  const muted = alert.filter.excludeAuthors ?? [];
  const hidden = <input type="hidden" name="id" value={alert.id} />;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/alerts', label: 'Alerts' }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {alert.name}
            <Badge tone={alert.mode === 'instant' ? 'accent' : 'outline'}>{MODE_LABELS[alert.mode]}</Badge>
            {alert.enabled ? <Badge tone="good">Enabled</Badge> : <Badge>Disabled</Badge>}
          </span>
        }
        description={describeFilter(alert.filter, context.names).join(' · ')}
        actions={<LinkButton href={`/mentions?alertId=${encodeURIComponent(alert.id)}`}>Mentions it matches</LinkButton>}
      />

      <div className="grid gap-3 @lg:grid-cols-3">
        <Stat label="Sent in the last 7 days" value={compact(alert.stats.sentLast7d)} hint="Across every channel" />
        <Stat label="Last sent" value={alert.stats.lastSentAt ? timeAgo(alert.stats.lastSentAt) : 'Never'} hint={alert.stats.lastSentAt ? date(alert.stats.lastSentAt) : undefined} />
        <Stat label="Schedule" value={<span className="text-base">{whenText(alert)}</span>} hint={alert.stats.nextRunAt ? `Next ${date(alert.stats.nextRunAt)}` : undefined} />
      </div>

      <Card title="Try it" description="A test sends a sample to every channel. Running the digest sends the last 24 hours now, without moving the schedule.">
        <div className="flex flex-wrap items-start gap-3">
          <ActionForm action={testAlertAction}>
            {hidden}
            <SubmitButton variant="secondary">Send a test</SubmitButton>
          </ActionForm>
          {alert.mode === 'instant' ? null : (
            <ActionForm action={runDigestAction}>
              {hidden}
              <SubmitButton variant="secondary">Run digest now</SubmitButton>
            </ActionForm>
          )}
        </div>
      </Card>

      <AlertForm alert={alert} action={updateAlertAction} channels={context.channels} keywords={context.keywords} groups={context.groups} />

      <Card title="Muted authors" description="Never sent by this rule. Links are stored as the author's profile; a name or handle matches on every platform.">
        {muted.length ? (
          <ul className="mb-4 divide-y divide-line rounded-md border border-line">
            {muted.map((author, authorIndex) => (
              <li key={`${author}-${authorIndex}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{author}</span>
                <ActionForm action={unmuteAuthorAction}>
                  {hidden}
                  <input type="hidden" name="author" value={author} />
                  <SubmitButton size="sm" variant="ghost">Unmute</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">Nobody is muted.</p>
        )}
        <ActionForm action={muteAuthorsAction} resetOnSuccess className="space-y-2">
          {hidden}
          <Field label="Mute authors" hint="One per line, up to 50 at a time: profile or post links, @handles, u/names or display names.">
            <Textarea name="authors" rows={3} placeholder={'https://x.com/somebot\n@spammer'} />
          </Field>
          <SubmitButton variant="secondary">Mute</SubmitButton>
        </ActionForm>
      </Card>

      <Card title="Delete alert" description="The rule stops at once. Its channels stay.">
        <ActionForm action={deleteAlertAction}>
          {hidden}
          <SubmitButton variant="danger" confirm={`Delete the alert "${alert.name}"?`}>Delete alert</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
