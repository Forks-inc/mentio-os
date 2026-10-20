/**
 * The API client, server side only. The API key is read from the
 * environment here and nowhere else; pages and server actions import
 * `mentio()`, and nothing that imports this file can be bundled for the
 * browser (the `typeof window` check fails loudly if it ever is).
 */
import { createMentio } from '@mentio-dev/sdk';

if (typeof window !== 'undefined') {
  throw new Error('Este módulo solo se ejecuta en el servidor: la clave de API nunca debe llegar al navegador.');
}

let client: ReturnType<typeof createMentio> | undefined;

export function mentio() {
  if (client) return client;
  const apiKey = process.env.MENTIO_API_KEY;
  if (!apiKey) {
    throw new Error('La clave de API no está configurada. Copia .env.example a .env.local y agrega tu clave.');
  }
  client = createMentio({ apiKey, ...(process.env.MENTIO_API_URL ? { baseUrl: process.env.MENTIO_API_URL } : {}) });
  return client;
}

/** The SDK never throws on a non-2xx; this turns an error body into one. */
export function unwrap<T>(result: { data?: T; error?: unknown }): T {
  if (result.error !== undefined || result.data === undefined) {
    const body = result.error as { error?: { code?: string; message?: string } } | undefined;
    const message = body?.error?.message ?? 'La API devolvió un error.';
    throw new Error(body?.error?.code ? `${body.error.code}: ${message}` : message);
  }
  return result.data;
}
