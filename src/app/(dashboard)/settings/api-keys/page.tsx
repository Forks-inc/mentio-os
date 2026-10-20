import { Plus } from 'lucide-react';
import { Badge, Card, DatePicker, Field, Input, PageHeader, Select, Table, td, TableCell, TableRow } from '@/components/ui';
import { ActionForm, SubmitButton, DrawerButton } from '@/components/ui/client';
import { SecretForm } from '@/app/(dashboard)/channels/secret-form';
import { date, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { createApiKeyAction, revokeApiKeyAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Claves de API' };

/** Claves para scripts, agentes y este panel. Después de crear una clave, solo se muestra el prefijo. */
export default async function ApiKeys() {
  const keys = unwrap(await mentio().listApiKeys()).data;
  // Which key this dashboard runs on, so nobody revokes it by accident. Only a yes/no leaves the server.
  const own = process.env.MENTIO_API_KEY ?? '';
  const now = Date.now();

  return (
    <div className="space-y-6">
      <PageHeader title="Claves de API" description="Claves para la API REST, los SDK, la CLI y MCP. Una clave de lectura solo permite consultar datos." actions={
          <DrawerButton create variant="primary" label="Nueva clave" icon={<Plus />} title="Nueva clave de API">
      <SecretForm action={createApiKeyAction} className="grid gap-4" title="Tu nueva clave de API" warning="Se muestra una sola vez. Guárdala ahora en un gestor de secretos o en un archivo de entorno; después solo se conserva el prefijo.">
        <Field label="Nombre">
          <Input name="name" maxLength={80} placeholder="Exportación nocturna" />
        </Field>
        <Field label="Permisos">
          <Select name="scope" defaultValue="write" options={[['write', 'Lectura y escritura'], ['read', 'Solo lectura']] as const} />
        </Field>
        <Field label="Vencimiento" hint="Opcional; al final de ese día en UTC.">
          <DatePicker name="expires" fromDay={new Date(now + 86_400_000).toISOString().slice(0, 10)} placeholder="Sin vencimiento" />
        </Field>
        <div data-slot="form-actions" className="flex justify-end">
          <SubmitButton>Crear clave</SubmitButton>
        </div>
      </SecretForm>
          </DrawerButton>
        }
      />


      <Table head={['Nombre', 'Clave', 'Permisos', 'Último uso', 'Creada', '']} empty={keys.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No hay claves.</p> : null}>
        {keys.map((key) => {
          const expired = key.expiresAt !== null && new Date(key.expiresAt).getTime() < now;
          const isOwn = key.prefix.length > 8 && own.startsWith(key.prefix);
          return (
            <TableRow key={key.id} className={expired ? 'text-muted-foreground' : ''}>
              <TableCell className={td}>
                <span className="font-medium">{key.name}</span>
                {isOwn ? <Badge tone="accent" className="ml-2">Este panel</Badge> : null}
                {key.expiresAt ? (
                  <p className={expired ? 'text-xs text-red-600' : 'text-xs text-muted-foreground'}>{expired ? 'Venció' : 'Vence'} {date(key.expiresAt)}</p>
                ) : null}
              </TableCell>
              <TableCell className={`${td} font-mono text-xs`}>{key.prefix}…</TableCell>
              <TableCell className={td}>
                <Badge tone={key.scope === 'write' ? 'accent' : 'neutral'}>{key.scope === 'write' ? 'Lectura y escritura' : 'Solo lectura'}</Badge>
              </TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground whitespace-nowrap`}>{key.lastUsedAt ? timeAgo(key.lastUsedAt) : 'Nunca'}</TableCell>
              <TableCell className={`${td} text-xs text-muted-foreground whitespace-nowrap`}>{date(key.createdAt)}</TableCell>
              <TableCell className={`${td} text-right`}>
                <ActionForm action={revokeApiKeyAction}>
                  <input type="hidden" name="id" value={key.id} />
                  <SubmitButton
                    size="sm"
                    variant="danger"
                    confirm={isOwn ? 'Esta es la clave que usa este panel. Si la revocas, el panel dejará de funcionar hasta que configures una clave nueva en el servidor. ¿Revocarla de todos modos?' : `¿Revocar "${key.name}"? Todo lo que la use dejará de funcionar de inmediato.`}
                  >
                    Revocar
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
