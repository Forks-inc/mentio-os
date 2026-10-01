import { ActionForm, SubmitButton } from '@/components/ui/client';
import { Badge, Card, Conditions, Field, Input, LinkButton, PageHeader, Stat } from '@/components/ui';
import { date } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { FilterFields } from '../../people/filter-fields';
import { describeFilter, filterToSearch } from '../../people/filters';
import { deleteSegment, updateSegment } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Segment' };

/** Edit one segment: its name, what it means, and the conditions. */
export default async function SegmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = mentio();
  const [segment, members] = await Promise.all([api.getSegment({ path: { id } }).then(unwrap), api.listMembers().then(unwrap)]);
  const conditions = describeFilter(segment.filter, new Map(members.data.map((m) => [m.userId, m.name ?? m.email])));
  const filterSearch = filterToSearch(segment.filter);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/segments', label: 'Segments' }}
        title={segment.name}
        description={segment.description || undefined}
        actions={
          <>
            <LinkButton href={`/people?segmentId=${segment.id}`} variant="primary">View {segment.count} people</LinkButton>
            <a href={`/people/export?segmentId=${segment.id}`} download className="text-sm text-primary hover:underline">Export CSV</a>
          </>
        }
      />

      <div className="grid gap-3 @lg:grid-cols-3">
        <Stat label="People now" value={segment.count} href={`/people?segmentId=${segment.id}`} />
        <Stat label="Created" value={<span className="text-base">{date(segment.createdAt)}</span>} />
        <Stat label="Updated" value={<span className="text-base">{date(segment.updatedAt)}</span>} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Conditions conditions={conditions} max={3} empty="No conditions: everyone." />
        {filterSearch ? <LinkButton href={`/people?${filterSearch}`} size="sm" variant="ghost">Tweak on People</LinkButton> : null}
      </div>

      <Card title="Edit">
        <ActionForm action={updateSegment} className="space-y-5">
          <input type="hidden" name="id" value={segment.id} />
          <div className="grid gap-3 @lg:grid-cols-[1fr_2fr]">
            <Field label="Name"><Input name="name" required maxLength={80} defaultValue={segment.name} /></Field>
            <Field label="Description"><Input name="description" maxLength={500} defaultValue={segment.description} /></Field>
          </div>
          <FilterFields filter={segment.filter} members={members.data} />
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
      </Card>

      <Card title="Delete segment" description="Removes the saved filter. Nobody in it is touched.">
        <ActionForm action={deleteSegment}>
          <input type="hidden" name="id" value={segment.id} />
          <SubmitButton variant="danger" confirm={`Delete the segment "${segment.name}"?`}>Delete segment</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
