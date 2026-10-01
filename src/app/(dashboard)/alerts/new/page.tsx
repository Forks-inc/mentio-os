import { PageHeader } from '@/components/ui';
import { createAlertAction } from '../actions';
import { AlertForm } from '../alert-form';
import { loadRuleContext } from '../names';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New alert' };

export default async function NewAlert() {
  const { channels, keywords, groups } = await loadRuleContext();
  return (
    <div className="max-w-3xl">
      <PageHeader title="New alert" description="Pick what to watch, when to send it and where." back={{ href: '/alerts', label: 'Alerts' }} />
      <AlertForm action={createAlertAction} channels={channels} keywords={keywords} groups={groups} />
    </div>
  );
}
