/** One form for a new rule and an existing one: what it watches, when it sends, where. */
import type { Alert, Channel, Group, Keyword } from '@mentio-dev/sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ActionState } from '@/lib/action';
import { INTENTS, SENTIMENTS, platformName, tagName } from '@/lib/format';
import { Card, CheckboxGroup, Combobox, Field, Input, Select, Textarea, SwitchRow, Segmented } from '@/components/ui';
import { FormFilters } from '@/components/url-filters';
import { filterDefaults } from '@/lib/filter-defaults';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { MODE_LABELS, MODES, RELEVANCE_LINE, WEEKDAYS, alertFilterDefs, timeOf } from './rule';

const KIND_LABELS: Record<Channel['kind'], string> = { slack: 'Slack', email: 'Email', webhook: 'Webhook', telegram: 'Telegram' };

function timezones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC'];
  }
}

function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Card title={title} description={description}>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function AlertForm({
  alert,
  channels,
  keywords,
  groups,
  action,
}: {
  alert?: Alert;
  channels: Channel[];
  keywords: Keyword[];
  groups: Group[];
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const f = alert?.filter ?? {};
  const s = alert?.schedule ?? null;
  const joined = (values?: string[]) => (values ?? []).join(', ');
  return (
    <ActionForm action={action} className="space-y-6">
      {alert ? <input type="hidden" name="id" value={alert.id} /> : null}

      <Section title="Rule">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="Name">
            <Input name="name" required maxLength={80} defaultValue={alert?.name} placeholder="Negative mentions of our brand" />
          </Field>
          <Field label="Webhook event name" hint="Carried in webhook payloads. Empty uses the default (mention.matched, or digest).">
            <Input name="event" maxLength={60} defaultValue={alert?.event ?? ''} placeholder="mention.negative" />
          </Field>
        </div>
        <SwitchRow name="enabled" defaultChecked={alert?.enabled ?? true} label="Enabled" hint="A disabled rule keeps its settings and sends nothing." />
      </Section>

      <Section title="When it sends" description="Instant sends each mention as it arrives. A digest sends one summary at a set local time.">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field group label="Mode" className="@lg:col-span-2">
            <Segmented
              name="mode"
              defaultValue={alert?.mode ?? 'instant'}
              options={MODES.map((m) => ({ value: m, label: MODE_LABELS[m], description: m === 'instant' ? 'Each mention as it arrives.' : m === 'daily' ? 'One summary a day, at the time below.' : 'One summary a week, on the day below.' }))}
            />
          </Field>
          <Field label="Weekday" hint="Weekly digests only.">
            <Select name="weekday" defaultValue={String(s?.weekday ?? 1)} options={WEEKDAYS.map((d, i) => [String(i), d] as const)} />
          </Field>
          <Field label="Time" hint="Daily and weekly digests.">
            <Input type="time" name="time" defaultValue={s ? timeOf(s) : '09:00'} />
          </Field>
          <Field label="Timezone" hint="An IANA zone, like Europe/Madrid.">
            <Combobox name="timezone" options={timezones()} defaultValue={s?.timezone ?? 'UTC'} placeholder="Search a zone" />
          </Field>
        </div>
        <SwitchRow name="skipEmpty" defaultChecked={s?.skipEmpty ?? true} label="Skip the digest when nothing matched" />
      </Section>

      <Section title="Where it sends" description={<>Pick one or more channels. <Link href="/channels/new" className="text-primary hover:underline">Add a channel</Link></>}>
        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No channels yet. The rule can be saved and connected later.</p>
        ) : (
          <CheckboxGroup
            name="channelIds"
            options={channels.map((c) => [c.id, `${c.label} (${KIND_LABELS[c.kind]})`] as const)}
            selected={alert?.channels.map((c) => c.id) ?? []}
          />
        )}
      </Section>

      <Section title="What it watches" description="Every condition you set must hold. Leave a field empty to accept anything.">
        <Field
          label="Minimum relevance"
          hint={`0 to 100. Empty sends relevant mentions only (scored ${RELEVANCE_LINE} and up). Under ${RELEVANCE_LINE} also sends what the classifier scored as noise; 0 sends every match. Email channels always keep the ${RELEVANCE_LINE} line.`}
        >
          <Input type="number" name="minRelevance" min={0} max={100} step={1} defaultValue={f.minRelevance ?? ''} placeholder={String(RELEVANCE_LINE)} className="@lg:max-w-40" />
        </Field>

        <Field group label="Conditions" hint="Every condition must hold. No conditions sends every relevant mention.">
          <FormFilters
            filters={alertFilterDefs(
              keywords.map((k) => ({ value: k.id, label: k.group.isDefault ? k.term : `${k.term} (${k.group.name})` })),
              groups.length > 1 ? groups.map((g) => ({ value: g.id, label: g.name })) : [],
            )}
            defaults={filterDefaults({ ...f, minRelevance: undefined, excludeAuthors: undefined })}
            empty="No conditions yet."
          />
        </Field>

        {alert ? null : (
          <Field label="Muted authors" hint="One per line: profile or post links, @handles or names. Never sent.">
            <Textarea name="excludeAuthors" rows={3} placeholder={'x.com/somebot\n@spammer'} />
          </Field>
        )}
      </Section>

      <div data-slot="form-actions" className="flex justify-end">
        <SubmitButton>{alert ? 'Save alert' : 'Create alert'}</SubmitButton>
      </div>
    </ActionForm>
  );
}
