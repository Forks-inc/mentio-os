import Link from 'next/link';
import { Eye, Plus } from 'lucide-react';
import { Conditions, EmptyState, Field, Input, LinkButton, PageHeader, Table, td, TableCell, TableRow, rowLink } from '@/components/ui';
import { ActionForm, DrawerButton, SubmitButton } from '@/components/ui/client';
import { describeFilter, fromViewFilter, parseFilters } from '@/app/(dashboard)/mentions/filters';
import { ViewFilterFields } from '@/app/(dashboard)/mentions/filter-fields';
import { loadFilterOptions, type FilterOptions } from '@/app/(dashboard)/mentions/options';
import { timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { createView } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Views' };

/** "New view" in a drawer: a name and the conditions, as chips. */
function NewView({ options, primary = true }: { options: FilterOptions; primary?: boolean }) {
  return (
    <DrawerButton create={primary} label="New view" icon={<Plus />} title="New view" description="A saved filter over your mentions." variant={primary ? 'primary' : 'secondary'}>
      <ActionForm action={createView} className="grid gap-5">
        <Field label="Name">
          <Input name="name" required maxLength={80} placeholder="Unhappy customers" />
        </Field>
        <Field label="Description">
          <Input name="description" maxLength={500} placeholder="What this view is for" />
        </Field>
        <ViewFilterFields values={parseFilters(() => [])} options={options} />
        <div data-slot="form-actions" className="flex justify-end">
          <SubmitButton>Create view</SubmitButton>
        </div>
      </ActionForm>
    </DrawerButton>
  );
}

/** Saved filters over the mentions feed. Opening one opens the feed with it as the base. */
export default async function ViewsPage() {
  const [views, options] = await Promise.all([mentio().listViews().then(unwrap), loadFilterOptions()]);

  return (
    <div>
      <PageHeader title="Views" description="Saved filters over your mentions, always up to date." actions={<NewView options={options} />} />

      {views.data.length === 0 ? (
        <EmptyState icon={Eye} title="No views yet" action={<NewView options={options} primary={false} />}>
          Filter the <Link href="/mentions" className="text-primary hover:underline">mentions</Link> and save them, or build one here.
        </EmptyState>
      ) : (
        <Table head={['View', 'Conditions', 'Edited', '']}>
          {views.data.map((view) => {
            const href = `/mentions?viewId=${encodeURIComponent(view.id)}`;
            return (
              <TableRow key={view.id}>
                <TableCell className={td}>
                  <Link href={href} data-row-link className={`font-medium hover:underline ${rowLink}`}>{view.name}</Link>
                  {view.description ? <p className="text-xs text-muted-foreground">{view.description}</p> : null}
                </TableCell>
                <TableCell className={td}>
                  <Conditions conditions={describeFilter(fromViewFilter(view.filter), options.names)} empty="Every mention" />
                </TableCell>
                <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`}>{timeAgo(view.updatedAt)}</TableCell>
                <TableCell className={`${td} text-right whitespace-nowrap`}>
                  <LinkButton href={href} size="sm" variant="ghost">Open</LinkButton>
                  <LinkButton href={`/views/${encodeURIComponent(view.id)}`} size="sm" variant="ghost">Edit</LinkButton>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}
    </div>
  );
}
