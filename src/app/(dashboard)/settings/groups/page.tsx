import { Plus } from 'lucide-react';
import Link from 'next/link';
import { FolderTree } from 'lucide-react';
import { Badge, Card, EmptyState, Field, Input, PageHeader, Table, Textarea, td, TableCell, TableRow, rowLink } from '@/components/ui';
import { ActionForm, SubmitButton, DrawerButton } from '@/components/ui/client';
import { date } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { createGroupAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Groups' };

/** Groups: what a workspace counts by (a customer, a campaign). The same term can be tracked once per group. */
export default async function Groups() {
  const groups = unwrap(await mentio().listGroups()).data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Sort keywords by customer, campaign or product. The same term can be tracked once in each group, and each group can have its own company description."
      actions={
          <DrawerButton create variant="primary" label="New group" icon={<Plus />} title="New group" description="A customer, a campaign or a product, with its own keywords.">
      <ActionForm action={createGroupAction} className="space-y-4">
        <div className="grid gap-4">
          <Field label="Name" hint="A customer, a campaign, a product. Unique in this workspace.">
            <Input name="name" required maxLength={80} placeholder="Acme Inc" />
          </Field>
          <Field label="Your id (optional)" hint="Your own id for it, like a customer id. Unique too.">
            <Input name="externalId" maxLength={128} placeholder="cus_123" />
          </Field>
        </div>
        <Field
          label="Company description (optional)"
          hint="Read by the classifier for this group's keywords in place of the whole company profile, guidelines and competitors included. Empty uses the company profile."
        >
          <Textarea name="context" maxLength={4000} placeholder="Who the business is, what it sells, for whom, and what is not it." />
        </Field>
        <div data-slot="form-actions" className="flex justify-end">
          <SubmitButton>Create group</SubmitButton>
        </div>
      </ActionForm>
          </DrawerButton>
        }
      />

      {groups.length === 0 ? (
        <EmptyState icon={FolderTree} title="No groups yet." />
      ) : (
        <Table head={['Group', 'Your id', 'Keywords', 'Company description', 'Created']}>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell className={td}>
                <Link href={`/settings/groups/${group.id}`} data-row-link className={`font-medium hover:underline ${rowLink}`}>{group.name}</Link>
                {group.isDefault ? <Badge className="ml-2" tone="accent">Default</Badge> : null}
              </TableCell>
              <TableCell className={`${td} font-mono text-xs text-muted-foreground`}>{group.externalId ?? ''}</TableCell>
              <TableCell className={`${td} tabular-nums`}>
                <Link href={`/keywords?groupId=${encodeURIComponent(group.id)}`} className="hover:underline">
                  {group.stats.keywords}
                </Link>
                <span className="text-xs text-muted-foreground"> ({group.stats.active} active)</span>
              </TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground`}>{group.isDefault ? 'Company profile' : group.context ? 'Its own' : 'Company profile'}</TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground`}>{date(group.createdAt)}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}

    </div>
  );
}
