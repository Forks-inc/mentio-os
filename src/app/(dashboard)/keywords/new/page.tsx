import { PageHeader } from '@/components/ui';
import { mentio, unwrap } from '@/lib/mentio';
import { KeywordForm } from '../keyword-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New keyword' };

export default async function NewKeyword() {
  const groups = unwrap(await mentio().listGroups()).data;
  return (
    <div className="max-w-3xl">
      <PageHeader title="New keyword" description="What to listen for, where, and what to leave out." back={{ href: '/keywords', label: 'Keywords' }} />
      <KeywordForm groups={groups} />
    </div>
  );
}
