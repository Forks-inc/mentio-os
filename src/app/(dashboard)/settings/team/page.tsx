import { Plus } from 'lucide-react';
import type { Member } from '@mentio-dev/sdk';
import { Badge, Card, Field, Input, Notice, PageHeader, Select, Table, td, type Tone, TableCell, TableRow } from '@/components/ui';
import { ActionForm, SubmitButton, DrawerButton } from '@/components/ui/client';
import { date, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { inviteAction, removeMemberAction, revokeInvitationAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team' };

const ROLE_TONE: Record<Member['role'], Tone> = { owner: 'solid', admin: 'accent', member: 'neutral' };

/** Who is in the workspace, and who has been asked to join. */
export default async function Team() {
  const api = mentio();
  const [members, invitations] = await Promise.all([
    api.listMembers().then(unwrap),
    api
      .listInvitations()
      .then(unwrap)
      .then((r) => ({ data: r.data, error: null }))
      .catch((error: unknown) => ({ data: [], error: error instanceof Error ? error.message : 'Could not load invitations.' })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Owners handle everything, billing included. Admins manage the team. Members work the feed."
      actions={
          <DrawerButton create variant="primary" label="Invite" icon={<Plus />} title="Invite someone" description="They get an email link that works for 48 hours.">
      <ActionForm action={inviteAction} resetOnSuccess className="grid gap-4">
        <Field label="Email">
          <Input type="email" name="email" required maxLength={200} placeholder="teammate@example.com" />
        </Field>
        <Field label="Role">
          <Select name="role" defaultValue="member" options={[['member', 'Member'], ['admin', 'Admin']] as const} />
        </Field>
        <div data-slot="form-actions" className="flex justify-end">
          <SubmitButton>Send invitation</SubmitButton>
        </div>
      </ActionForm>
          </DrawerButton>
        }
      />

      <p className="rounded-lg border border-line bg-card px-4 py-3 text-xs text-muted-foreground">
        Inviting and removing people needs a signed-in owner or admin. With an API key the API refuses, and the reason shows next to the button.
      </p>


      <section>
        <h2 className="mb-2 text-sm font-semibold">Members</h2>
        <Table head={['Person', 'Role', 'Joined', '']}>
          {members.data.map((m) => (
            <TableRow key={m.id}>
              <TableCell className={td}>
                <p className="font-medium">{m.name ?? m.email}</p>
                {m.name ? <p className="text-xs text-muted-foreground">{m.email}</p> : null}
              </TableCell>
              <TableCell className={td}>
                <Badge tone={ROLE_TONE[m.role]}>{m.role}</Badge>
              </TableCell>
              <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`}>{date(m.joinedAt)}</TableCell>
              <TableCell className={`${td} text-right`}>
                <ActionForm action={removeMemberAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton size="sm" variant="danger" confirm={`Remove ${m.name ?? m.email} from the workspace? Their notes and mentions stay.`}>Remove</SubmitButton>
                </ActionForm>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Pending invitations</h2>
        {invitations.error ? (
          <Notice tone="bad">{invitations.error}</Notice>
        ) : (
          <Table
            head={['Email', 'Role', 'Invited by', 'Expires', '']}
            empty={invitations.data.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No pending invitations.</p> : null}
          >
            {invitations.data.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className={`${td} font-medium`}>{inv.email}</TableCell>
                <TableCell className={td}>
                  <Badge tone={ROLE_TONE[inv.role]}>{inv.role}</Badge>
                </TableCell>
                <TableCell className={`${td} text-xs text-muted-foreground`}>{inv.invitedBy ? (inv.invitedBy.name ?? inv.invitedBy.email) : 'Unknown'}</TableCell>
                <TableCell className={`${td} text-xs whitespace-nowrap text-muted-foreground`} title={date(inv.expiresAt)}>
                  {new Date(inv.expiresAt).getTime() > Date.now() ? `in ${timeUntil(inv.expiresAt)}` : 'Expired'}
                  <p className="text-muted-foreground">sent {timeAgo(inv.createdAt)}</p>
                </TableCell>
                <TableCell className={`${td} text-right`}>
                  <ActionForm action={revokeInvitationAction}>
                    <input type="hidden" name="id" value={inv.id} />
                    <SubmitButton size="sm" variant="danger" confirm={`Revoke the invitation for ${inv.email}?`}>Revoke</SubmitButton>
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
  return hours < 1 ? 'under an hour' : `${hours}h`;
}
