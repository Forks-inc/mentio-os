'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action';
import { SESSION_COOKIE, SESSION_MAX_AGE, passwordProtected, sameDigest, sessionToken } from '@/lib/session';

/** Only a path on this site, so the login can never redirect elsewhere. */
const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === 'string' ? value : '';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
};

export async function signIn(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!passwordProtected()) redirect('/');
  const given = await sessionToken(String(form.get('password') ?? ''));
  const expected = await sessionToken();
  if (!sameDigest(given, expected)) return { error: 'La contraseña no es correcta.', at: Date.now() };
  (await cookies()).set(SESSION_COOKIE, expected, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE });
  redirect(safeNext(form.get('next')));
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
