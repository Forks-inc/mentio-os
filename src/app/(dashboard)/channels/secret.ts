/**
 * A write that returns a secret the API shows only once (a webhook signing
 * secret, a new API key). The state carries it back to the form that asked,
 * which shows it with a copy button; it is never stored or logged here.
 */
import { run, type ActionState } from '@/lib/action';

export type SecretState = (NonNullable<ActionState> & { secret?: string; href?: string }) | null;

export async function runSecret(work: () => Promise<{ ok: string; secret?: string; href?: string }>): Promise<SecretState> {
  let extra: { secret?: string; href?: string } = {};
  const state = await run(async () => {
    const result = await work();
    extra = { secret: result.secret, href: result.href };
    return result.ok;
  });
  return state?.ok ? { ...state, ...extra } : state;
}
