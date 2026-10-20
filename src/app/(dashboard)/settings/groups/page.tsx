import { Plus } from 'lucide-react';
import Link from 'next/link';
import { FolderTree } from 'lucide-react';
import { Badge, Card, EmptyState, Field, Input, PageHeader, Table, Textarea, td, TableCell, TableRow, rowLink } from '@/components/ui';
import { ActionForm, SubmitButton, DrawerButton } from '@/components/ui/client';
import { date } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { createGroupAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campañas' };

/** Campaigns organize monitored candidates and topics. A term can be tracked once per campaign. */
export default async function Groups() {
  const groups = unwrap(await mentio().listGroups()).data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campañas"
        description="Organiza los candidatos y temas monitoreados por campaña. Puedes seguir un mismo término en varias campañas y dar contexto propio a cada una."
      actions={
          <DrawerButton create variant="primary" label="Nueva campaña" icon={<Plus />} title="Nueva campaña" description="Agrupa los candidatos y temas monitoreados y define su contexto.">
      <ActionForm action={createGroupAction} className="space-y-4">
        <div className="grid gap-4">
          <Field label="Nombre" hint="El nombre de la campaña debe ser único en este espacio de trabajo.">
            <Input name="name" required maxLength={80} placeholder="Campaña estatal 2027" />
          </Field>
          <Field label="Identificador externo (opcional)" hint="Tu propio identificador para esta campaña. También debe ser único.">
            <Input name="externalId" maxLength={128} placeholder="campana_123" />
          </Field>
        </div>
        <Field
          label="Descripción de campaña (opcional)"
          hint="El clasificador la usa para evaluar los términos de esta campaña en lugar del perfil completo de la organización. Si la dejas vacía, se usa ese perfil."
        >
          <Textarea name="context" maxLength={4000} placeholder="Describe la candidatura, sus propuestas, el electorado y los temas que no corresponden." />
        </Field>
        <div data-slot="form-actions" className="flex justify-end">
          <SubmitButton>Crear campaña</SubmitButton>
        </div>
      </ActionForm>
          </DrawerButton>
        }
      />

      {groups.length === 0 ? (
        <EmptyState icon={FolderTree} title="Aún no hay campañas." />
      ) : (
        <Table head={['Campaña', 'Identificador externo', 'Candidatos y temas', 'Descripción', 'Creada']}>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell className={td}>
                <Link href={`/settings/groups/${group.id}`} data-row-link className={`font-medium hover:underline ${rowLink}`}>{group.name}</Link>
                {group.isDefault ? <Badge className="ml-2" tone="accent">Predeterminada</Badge> : null}
              </TableCell>
              <TableCell className={`${td} font-mono text-xs text-muted-foreground`}>{group.externalId ?? ''}</TableCell>
              <TableCell className={`${td} tabular-nums`}>
                <Link href={`/keywords?groupId=${encodeURIComponent(group.id)}`} className="hover:underline">
                  {group.stats.keywords}
                </Link>
                <span className="text-xs text-muted-foreground"> ({group.stats.active} activos)</span>
              </TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground`}>{group.isDefault ? 'Perfil de la organización' : group.context ? 'Propia' : 'Perfil de la organización'}</TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground`}>{date(group.createdAt)}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}

    </div>
  );
}
