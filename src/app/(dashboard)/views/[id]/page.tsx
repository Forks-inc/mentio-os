import { notFound } from 'next/navigation';
import { Card, Field, Input, LinkButton, PageHeader } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { describeFilter, fromViewFilter } from '@/app/(dashboard)/mentions/filters';
import { ViewFilterFields } from '@/app/(dashboard)/mentions/filter-fields';
import { loadFilterOptions } from '@/app/(dashboard)/mentions/options';
import { mentio, unwrap } from '@/lib/mentio';
import { deleteView, updateView } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit view' };

export default async function ViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, options] = await Promise.all([mentio().getView({ path: { id } }), loadFilterOptions()]);
  if (result.response?.status === 404) notFound();
  const view = unwrap(result);
  const values = fromViewFilter(view.filter);
  const conditions = describeFilter(values, options.names);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/views', label: 'Views' }}
        title={view.name}
        description={conditions.length ? conditions.join(' · ') : 'No conditions: every mention.'}
        actions={<LinkButton href={`/mentions?viewId=${encodeURIComponent(view.id)}`} variant="primary">Open mentions</LinkButton>}
      />

      <Card title="Edit view" description="Saving replaces the whole filter with what this form holds.">
        <ActionForm action={updateView} className="space-y-5">
          <input type="hidden" name="id" value={view.id} />
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Name">
              <Input name="name" required maxLength={80} defaultValue={view.name} />
            </Field>
            <Field label="Description">
              <Input name="description" maxLength={500} defaultValue={view.description} />
            </Field>
          </div>
          <ViewFilterFields values={values} options={options} />
          <SubmitButton>Save view</SubmitButton>
        </ActionForm>
      </Card>

      <Card title="Delete view" description="The mentions stay; only the saved filter goes.">
        <ActionForm action={deleteView}>
          <input type="hidden" name="id" value={view.id} />
          <SubmitButton variant="danger" confirm={`Delete the view "${view.name}"?`}>Delete view</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
