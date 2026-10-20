import { PageHeader } from '@/components/ui';
import { mentio, unwrap } from '@/lib/mentio';
import { KeywordForm } from '../keyword-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Agregar candidato o tema' };

export default async function NewKeyword() {
  const groups = unwrap(await mentio().listGroups()).data;
  return (
    <div className="max-w-3xl">
      <PageHeader title="Agregar candidato o tema" description="Define qué conversación monitorear, en qué plataformas y qué excluir." back={{ href: '/keywords', label: 'Candidatos y temas' }} />
      <KeywordForm groups={groups} />
    </div>
  );
}
