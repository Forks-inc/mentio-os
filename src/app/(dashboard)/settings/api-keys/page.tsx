import { Plus } from 'lucide-react';
import { Badge, Card, DatePicker, Field, Input, PageHeader, Select, Table, td, TableCell, TableRow } from '@/components/ui';
import { ActionForm, SubmitButton, DrawerButton } from '@/components/ui/client';
import { SecretForm } from '@/app/(dashboard)/channels/secret-form';
import { date, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { createApiKeyAction, revokeApiKeyAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'API keys' };

/** Keys for scripts, agents and this dashboard. Only the prefix is ever shown after creation. */
export default async function ApiKeys() {
  const keys = unwrap(await mentio().listApiKeys()).data;
  // Which key this dashboard runs on, so nobody revokes it by accident. Only a yes/no leaves the server.
  const own = process.env.MENTIO_API_KEY ?? '';
  const now = Date.now();

  return (
    <div className="space-y-6">
      <PageHeader title="API keys" description="Keys for the REST API, the SDKs, the CLI and MCP. A read key can only GET." actions={
          <DrawerButton create variant="primary" label="New key" icon={<Plus />} title="New API key">
      <SecretForm action={createApiKeyAction} className="grid gap-4" title="Your new API key" warning="Shown once. Store it in a secret manager or an env file now; only its prefix is kept.">
        <Field label="Name">
          <Input name="name" maxLength={80} placeholder="Zapier, nightly export" />
        </Field>
        <Field label="Scope">
          <Select name="scope" defaultValue="write" options={[['write', 'Read and write'], ['read', 'Read only']] as const} />
        </Field>
        <Field label="Expires" hint="Optional, end of that day UTC.">
          <DatePicker name="expires" fromDay={new Date(now + 86_400_000).toISOString().slice(0, 10)} placeholder="Never" />
        </Field>
        <div data-slot="form-actions" className="flex justify-end">
          <SubmitButton>Create key</SubmitButton>
        </div>
      </SecretForm>
          </DrawerButton>
        }
      />


      <Table head={['Name', 'Key', 'Scope', 'Last used', 'Created', '']} empty={keys.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No keys.</p> : null}>
        {keys.map((key) => {
          const expired = key.expiresAt !== null && new Date(key.expiresAt).getTime() < now;
          const isOwn = key.prefix.length > 8 && own.startsWith(key.prefix);
          return (
            <TableRow key={key.id} className={expired ? 'text-muted-foreground' : ''}>
              <TableCell className={td}>
                <span className="font-medium">{key.name}</span>
                {isOwn ? <Badge tone="accent" className="ml-2">This dashboard</Badge> : null}
                {key.expiresAt ? (
                  <p className={expired ? 'text-xs text-red-600' : 'text-xs text-muted-foreground'}>{expired ? 'Expired' : 'Expires'} {date(key.expiresAt)}</p>
                ) : null}
              </TableCell>
              <TableCell className={`${td} font-mono text-xs`}>{key.prefix}…</TableCell>
              <TableCell className={td}>
                <Badge tone={key.scope === 'write' ? 'accent' : 'neutral'}>{key.scope}</Badge>
              </TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground whitespace-nowrap`}>{key.lastUsedAt ? timeAgo(key.lastUsedAt) : 'Never'}</TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground whitespace-nowrap`}>{date(key.createdAt)}</TableCell>
              <TableCell className={`${td} text-right`}>
                <ActionForm action={revokeApiKeyAction}>
                  <input type="hidden" name="id" value={key.id} />
                  <SubmitButton
                    size="sm"
                    variant="danger"
                    confirm={isOwn ? 'This is the key this dashboard uses. Revoking it breaks the dashboard until you set a new MENTIO_API_KEY. Revoke anyway?' : `Revoke "${key.name}"? Anything using it stops working at once.`}
                  >
                    Revoke
                  </SubmitButton>
                </ActionForm>
              </TableCell>
            </TableRow>
          );
        })}
      </Table>
    </div>
  );
}
