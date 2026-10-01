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
export const metadata = { title: 'New channel' };

const DASHBOARD = 'https://app.mentio.dev';

const BLURBS: Record<ChannelKind, string> = {
  slack: 'Post to a channel of your connected Slack workspace.',
  email: 'Send to a list of addresses.',
  webhook: 'POST signed JSON to your own endpoint.',
  telegram: 'Message a Telegram chat or group.',
};

export default async function NewChannel({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const requested = one(params, 'type');
  const kind: ChannelKind = isOneOf(KINDS, requested) ? requested : 'webhook';

  return (
    <div className="space-y-6">
      <PageHeader title="New channel" description="Choose where alerts should go." back={{ href: '/channels', label: 'Channels' }} />

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
    <Card title="Slack channel" description={<>Your Slack workspace must be connected to Mentio first, in the <a href={DASHBOARD} className="text-primary hover:underline">Mentio dashboard</a>. For a private channel, invite the Mentio app to it.</>}>
      <ActionForm action={createSlackChannel} className="space-y-4">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="Channel id" hint="In Slack: open the channel details; the id is at the bottom (C0123ABCD).">
            <Input name="channelId" required maxLength={40} placeholder="C0123ABCD" />
          </Field>
          <Field label="Channel name" hint="Used as the label.">
            <Input name="channelName" required maxLength={90} placeholder="#brand-alerts" />
          </Field>
        </div>
        <SubmitButton>Add Slack channel</SubmitButton>
      </ActionForm>
    </Card>
  );
}

function EmailForm() {
  return (
    <Card title="Email list" description="Each address gets a confirmation link and receives nothing until it is clicked. Members of your workspace are confirmed at once.">
      <ActionForm action={createEmailChannel} className="space-y-4">
        <Field label="Addresses" hint="One per line or comma separated, up to 20.">
          <Textarea name="emails" required rows={4} placeholder={'team@example.com\nfounder@example.com'} />
        </Field>
        <SubmitButton>Add email list</SubmitButton>
      </ActionForm>
    </Card>
  );
}

function WebhookForm() {
  return (
    <Card title="Webhook" description="Every request is signed with a secret shown once, after you create it.">
      <SecretForm action={createWebhookChannel} className="space-y-4" title="Your signing secret" warning="Shown once. Verify X-Mentions-Signature-V2 with it: v2= plus the hex HMAC-SHA256 of the timestamp, a dot and the raw body.">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="URL" hint="Where the POSTs go. Use https.">
            <Input name="url" type="text" inputMode="url" required placeholder="https://example.com/hooks/mentio" />
          </Field>
          <Field label="Label" hint="Defaults to the URL's host.">
            <Input name="label" maxLength={80} placeholder="CRM sync" />
          </Field>
        </div>
        <Field label="Custom headers" hint={'One per line as "Name: value", for your own auth.'}>
          <Textarea name="headers" rows={3} placeholder="Authorization: Bearer ..." className="font-mono" />
        </Field>
        <div>
          <p className="text-sm font-medium text-foreground">Account events</p>
          <p className="mb-2 text-xs text-muted-foreground">Sent here on their own, with no alert involved. Mentions and digests still arrive through alerts.</p>
          <CheckboxGroup name="events" options={ACCOUNT_EVENTS.map(([id, label]) => [id, `${label} (${id})`] as const)} selected={[]} />
        </div>
        <SubmitButton>Create webhook</SubmitButton>
      </SecretForm>
    </Card>
  );
}

async function TelegramInfo() {
  const telegram = unwrap(await mentio().listChannels()).data.filter((c) => c.kind === 'telegram');
  return (
    <Card title="Telegram" description="Telegram chats are connected from the Mentio dashboard, not through the API.">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground/80">
        <li>Open the <a href={DASHBOARD} className="text-primary hover:underline">Mentio dashboard</a> and connect Telegram.</li>
        <li>Follow the link it gives you and press Start, or add the bot to a group.</li>
        <li>The chat shows up here as a channel. Point an alert at it.</li>
      </ol>
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">Connected chats</p>
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
          <p className="text-sm text-muted-foreground">None yet.</p>
        )}
      </div>
    </Card>
  );
}
