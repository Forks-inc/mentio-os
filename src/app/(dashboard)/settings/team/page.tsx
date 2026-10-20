import { Plus } from 'lucide-react';
import type { Member } from '@mentio-dev/sdk';
import { Badge, Card, Field, Input, Notice, PageHeader, Select, Table, td, type Tone, TableCell, TableRow } from '@/components/ui';
import { ActionForm, SubmitButton, DrawerButton } from '@/components/ui/client';
import { date, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { inviteAction, removeMemberAction, revokeInvitationAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Equipo' };

const ROLE_TONE: Record<Member['role'], Tone> = { owner: 'solid', admin: 'accent', member: 'neutral' };
const ROLE_LABEL: Record<Member['role'], string> = { owner: 'Propietario', admin: 'Administrador', member: 'Miembro' };

/** Who is in the workspace, and who has been asked to join. */
export default async function Team() {
  const api = mentio();
  const [members, invitations] = await Promise.all([
    api.listMembers().then(unwrap),
    api
      .listInvitations()
      .then(unwrap)
      .then((r) => ({ data: r.data, error: null }))
      .catch((error: unknown) => ({ data: [], error: error instanceof Error ? error.message : 'No se pudieron cargar las invitaciones.' })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description="Las personas propietarias administran todo, incluida la facturación. Las administradoras gestionan el equipo. Los miembros revisan la conversación."
      actions={
          <DrawerButton create variant="primary" label="Invitar" icon={<Plus />} title="Invitar a alguien" description="Recibirá un enlace por correo electrónico válido durante 48 horas.">
      <ActionForm action={inviteAction} resetOnSuccess className="grid gap-4">
        <Field label="Correo electrónico">
          <Input type="email" name="email" required maxLength={200} placeholder="integrante@campana.mx" />
        </Field>
        <Field label="Rol">
          <Select name="role" defaultValue="member" options={[['member', 'Miembro'], ['admin', 'Administrador']] as const} />
        </Field>
        <div data-slot="form-actions" className="flex justify-end">
          <SubmitButton>Enviar invitación</SubmitButton>
        </div>
      </ActionForm>
          </DrawerButton>
        }
      />

      <p className="rounded-lg border border-line bg-card px-4 py-3 text-xs text-muted-foreground">
        Para invitar o quitar personas, debes iniciar sesión como propietario o administrador. La API rechaza estas acciones con una clave de API; el motivo aparece junto al botón.
      </p>


      <section>
        <h2 className="mb-2 text-sm font-semibold">Miembros</h2>
        <Table head={['Persona', 'Rol', 'Se unió', '']}>
          {members.data.map((m) => (
            <TableRow key={m.id}>
              <TableCell className={td}>
                <p className="font-medium">{m.name ?? m.email}</p>
                {m.name ? <p className="text-xs text-muted-foreground">{m.email}</p> : null}
              </TableCell>
              <TableCell className={td}>
                <Badge tone={ROLE_TONE[m.role]}>{ROLE_LABEL[m.role]}</Badge>
              </TableCell>
              <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`}>{date(m.joinedAt)}</TableCell>
              <TableCell className={`${td} text-right`}>
                <ActionForm action={removeMemberAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton size="sm" variant="danger" confirm={`¿Quitar a ${m.name ?? m.email} del espacio de trabajo? Sus notas y menciones se conservarán.`}>Quitar</SubmitButton>
                </ActionForm>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Invitaciones pendientes</h2>
        {invitations.error ? (
          <Notice tone="bad">{invitations.error}</Notice>
        ) : (
          <Table
            head={['Correo electrónico', 'Rol', 'Invitada por', 'Vence', '']}
            empty={invitations.data.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No hay invitaciones pendientes.</p> : null}
          >
            {invitations.data.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className={`${td} font-medium`}>{inv.email}</TableCell>
                <TableCell className={td}>
                  <Badge tone={ROLE_TONE[inv.role]}>{ROLE_LABEL[inv.role]}</Badge>
                </TableCell>
                <TableCell className={`${td} text-xs text-muted-foreground`}>{inv.invitedBy ? (inv.invitedBy.name ?? inv.invitedBy.email) : 'Desconocida'}</TableCell>
                <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`} title={date(inv.expiresAt)}>
                  {new Date(inv.expiresAt).getTime() > Date.now() ? `en ${timeUntil(inv.expiresAt)}` : 'Vencida'}
                  <p className="text-muted-foreground">enviada {timeAgo(inv.createdAt)}</p>
                </TableCell>
                <TableCell className={`${td} text-right`}>
                  <ActionForm action={revokeInvitationAction}>
                    <input type="hidden" name="id" value={inv.id} />
                    <SubmitButton size="sm" variant="danger" confirm={`¿Cancelar la invitación para ${inv.email}?`}>Cancelar</SubmitButton>
                  </ActionForm>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}

function timeUntil(iso: string) {
  const hours = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000));
  return hours < 1 ? 'menos de una hora' : `${hours} h`;
}
