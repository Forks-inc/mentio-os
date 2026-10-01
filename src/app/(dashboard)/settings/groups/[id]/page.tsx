import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Card, Field, Input, LinkButton, PageHeader, Stat, Textarea } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { date } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { deleteGroupAction, updateGroupAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Group' };

export default async function GroupDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await mentio().getGroup({ path: { id } });
  if (result.response?.status === 404) notFound();
  const group = unwrap(result);
  const keywordsHref = `/keywords?groupId=${encodeURIComponent(group.id)}`;
  const n = group.stats.keywords;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/settings/groups', label: 'Groups' }}
        title={
          <span className="flex items-center gap-2">
            {group.name}
            {group.isDefault ? <Badge tone="accent">Default</Badge> : null}
          </span>
        }
        description={`Created ${date(group.createdAt)}. Last changed ${date(group.updatedAt)}.`}
        actions={<LinkButton href={keywordsHref}>View keywords</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-3 @lg:max-w-md">
        <Stat label="Keywords" value={n} href={keywordsHref} />
        <Stat label="Active" value={group.stats.active} hint="not paused" />
      </div>

      <Card title="Settings">
        <ActionForm action={updateGroupAction} className="space-y-4">
          <input type="hidden" name="id" value={group.id} />
          {group.isDefault ? <input type="hidden" name="isDefault" value="true" /> : null}
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Name" hint="Unique in this workspace.">
              <Input name="name" required maxLength={80} defaultValue={group.name} />
            </Field>
            <Field label="Your id" hint="Your own id for it, like a customer id. Empty clears it.">
              <Input name="externalId" maxLength={128} defaultValue={group.externalId ?? ''} />
            </Field>
          </div>
          {group.isDefault ? (
            <p className="text-sm text-muted-foreground">
              The default group is the workspace itself: its keywords are judged against the <Link href="/settings/company" className="text-primary hover:underline">company profile</Link>.
            </p>
          ) : (
            <Field
              label="Company description"
              hint="Read by the classifier for this group's keywords in place of the whole company profile, guidelines and competitors included. New mentions use it at once; old ones are not rescored. Empty uses the company profile."
            >
              <Textarea name="context" rows={6} maxLength={4000} defaultValue={group.context ?? ''} />
            </Field>
          )}
          <SubmitButton>Save changes</SubmitButton>
        </ActionForm>
      </Card>

      <Card title="Delete group">
        {group.isDefault ? (
          <p className="text-sm text-muted-foreground">The default group cannot be deleted. Keywords created without a group land here. Move or delete its keywords instead.</p>
        ) : (
          <ActionForm action={deleteGroupAction} className="space-y-3">
            <input type="hidden" name="id" value={group.id} />
            <p className="text-sm text-muted-foreground">
              Deletes the group and {n === 1 ? 'its keyword' : `all ${n} of its keywords`}, with their mentions. Charges already made stay on your usage record.
            </p>
            <SubmitButton variant="danger" confirm={`Delete "${group.name}" and its ${n} ${n === 1 ? 'keyword' : 'keywords'}? Their mentions are deleted too. This cannot be undone.`}>
              Delete group and keywords
            </SubmitButton>
          </ActionForm>
        )}
      </Card>
    </div>
  );
}
