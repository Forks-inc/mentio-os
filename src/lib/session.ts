/**
 * The optional password in front of the dashboard. Set DASHBOARD_PASSWORD
 * and every page asks for it once per browser (a 30-day cookie); leave it
 * unset and the app is open, which is fine on localhost and nowhere else,
 * since whoever opens it acts with the API key's workspace. The cookie holds
 * an HMAC of the password, never the password, so changing the password
 * signs everyone out. Runs in proxy.ts and in server code alike (WebCrypto).
 */
export const SESSION_COOKIE = 'mentio_os_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const password = () => process.env.DASHBOARD_PASSWORD ?? '';

export const passwordProtected = () => password().length > 0;

/** The cookie value for a password: hex HMAC-SHA256 keyed by the password. */
export async function sessionToken(secret = password()): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('mentio-os-session-v1'));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison (both sides are fixed-length hex digests here). */
export function sameDigest(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
