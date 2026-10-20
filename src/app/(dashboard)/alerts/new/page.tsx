import { PageHeader } from '@/components/ui';
import { createAlertAction } from '../actions';
import { AlertForm } from '../alert-form';
import { loadRuleContext } from '../names';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Crear alerta' };

export default async function NewAlert() {
  const { channels, keywords, groups } = await loadRuleContext();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Crear alerta" description="Elige qué conversación monitorear, cuándo enviar el aviso y a qué canal." back={{ href: '/alerts', label: 'Alertas' }} />
      <AlertForm action={createAlertAction} channels={channels} keywords={keywords} groups={groups} />
    </div>
  );
}
