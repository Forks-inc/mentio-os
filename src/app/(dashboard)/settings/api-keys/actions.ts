'use server';

import { revalidatePath } from 'next/cache';
import { run, type ActionState } from '@/lib/action';
import { isOneOf, str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { runSecret, type SecretState } from '@/app/(dashboard)/channels/secret';

const SCOPES = ['read', 'write'] as const;

/** The key comes back once, on this response; the form shows it with a copy button. */
export async function createApiKeyAction(_: SecretState, form: FormData): Promise<SecretState> {
  return runSecret(async () => {
    const scope = str(form, 'scope');
    const expires = str(form, 'expires');
    const key = unwrap(
      await mentio().createApiKey({
        body: {
          name: str(form, 'name') || undefined,
          scope: isOneOf(SCOPES, scope) ? scope : 'write',
          // A date field: the key stops working at the end of that day, UTC.
          ...(expires ? { expiresAt: `${expires}T23:59:59.999Z` } : {}),
        },
      }),
    );
    revalidatePath('/settings/api-keys');
    return { ok: `Clave "${key.name}" creada`, secret: key.key };
  });
}

export async function revokeApiKeyAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    unwrap(await mentio().revokeApiKey({ path: { id: str(form, 'id') } }));
    revalidatePath('/settings/api-keys');
    return 'Clave revocada';
  });
}
