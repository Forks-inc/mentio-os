/**
 * How every write reports back. A server action takes the previous state and
 * the form, and returns a message the form shows inline: `ok` on success,
 * `error` with the API's own message on failure, so a 402 or a 409 reads as
 * a sentence next to the button instead of an error page.
 */
export type ActionState = { ok?: string; error?: string; at?: number } | null;

export async function run(work: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await work();
    return { ok: message || 'Saved', at: Date.now() };
  } catch (error) {
    // redirect() and notFound() work by throwing; let them through.
    if (error && typeof error === 'object' && 'digest' in error && String((error as { digest: unknown }).digest).startsWith('NEXT_')) throw error;
    return { error: error instanceof Error ? error.message : 'Something went wrong.', at: Date.now() };
  }
}
