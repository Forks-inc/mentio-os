import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { ActionForm, SubmitButton, DrawerButton } from '@/components/ui/client';
import { Badge, Card, Conditions, EmptyState, Field, Input, LinkButton, PageHeader, Table, td, TableCell, TableRow, rowLink } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { FilterFields } from '../people/filter-fields';
import { describeFilter, filterToSearch } from '../people/filters';
import { createSegment, deleteSegment, savePreset } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Segments' };

/** Saved audience filters. Members are worked out on every read, never stored. */
export default async function Segments() {
  const api = mentio();
  const [segments, members] = await Promise.all([api.listSegments().then(unwrap), api.listMembers().then(unwrap)]);
  const memberNames = new Map(members.data.map((m) => [m.userId, m.name ?? m.email]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segments"
        description="Named groups of people, like power users or unhappy customers. A segment is a filter, so its members change as mentions come in."
        actions={
          <>
            <LinkButton href="/people">People</LinkButton>
            <DrawerButton create variant="primary" label="New segment" icon={<Plus />} title="New segment" description="A saved audience filter; members update as mentions arrive.">
              <ActionForm action={createSegment} className="grid gap-4">
                <Field label="Name"><Input name="name" required maxLength={80} placeholder="Power users" /></Field>
                <Field label="Description"><Input name="description" maxLength={500} /></Field>
                <FilterFields filter={{}} members={members.data} />
                <div data-slot="form-actions" className="flex justify-end"><SubmitButton>Create segment</SubmitButton></div>
              </ActionForm>
            </DrawerButton>
          </>
        }
      />

      {segments.data.length === 0 ? (
        <EmptyState icon={Layers} title="No segments yet.">Save one from a preset below, build one here, or filter People and save it.</EmptyState>
      ) : (
        <Table head={['Segment', 'Conditions', 'People', 'Updated', '']}>
          {segments.data.map((segment) => {
            const conditions = describeFilter(segment.filter, memberNames);
            return (
              <TableRow key={segment.id}>
                <TableCell className={td}>
                  <Link href={`/segments/${segment.id}`} data-row-link className={`font-medium hover:underline ${rowLink}`}>{segment.name}</Link>
                  {segment.description ? <p className="text-xs text-muted-foreground">{segment.description}</p> : null}
                </TableCell>
                <TableCell className={td}>
                  <Conditions conditions={conditions} empty="Everyone" />
                </TableCell>
                <TableCell className={`${td} tabular-nums`}>
                  <Link href={`/people?segmentId=${segment.id}`} className="text-primary hover:underline">{segment.count}</Link>
                </TableCell>
                <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`}>{timeAgo(segment.updatedAt)}</TableCell>
                <TableCell className={td}>
                  <div className="flex justify-end gap-1.5">
                    <LinkButton href={`/people?segmentId=${segment.id}`} size="sm">View people</LinkButton>
                    <LinkButton href={`/segments/${segment.id}`} size="sm">Edit</LinkButton>
                    <ActionForm action={deleteSegment}>
                      <input type="hidden" name="id" value={segment.id} />
                      <SubmitButton variant="danger" size="sm" confirm={`Delete the segment "${segment.name}"? The people stay.`}>Delete</SubmitButton>
                    </ActionForm>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}

      {segments.presets.length ? (
        <Card title="Presets" description="Starting points. Save one, then edit it like any other segment.">
          <ul className="grid gap-3 @lg:grid-cols-2">
            {segments.presets.map((preset) => (
              <li key={preset.key} className="flex flex-col justify-between gap-2 rounded-md border border-line p-3">
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                  <div className="mt-2">
                    <Conditions conditions={describeFilter(preset.filter, memberNames)} empty="Everyone" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ActionForm action={savePreset}>
                    <input type="hidden" name="key" value={preset.key} />
                    <SubmitButton size="sm">Save</SubmitButton>
                  </ActionForm>
                  <Link href={`/people?${filterToSearch(preset.filter)}`} className="text-xs text-primary hover:underline">Preview people</Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

    </div>
  );
}
