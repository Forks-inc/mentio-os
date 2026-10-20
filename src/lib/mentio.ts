/**
 * The API client, server side only. The API key is read from the
 * environment here and nowhere else; pages and server actions import
 * `mentio()`, and nothing that imports this file can be bundled for the
 * browser (the `typeof window` check fails loudly if it ever is).
 */
import { createMentio } from '@mentio-dev/sdk';
import { apiErrorMessage } from '@/lib/action';

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
export function reportApiError(status: number | undefined, original: unknown) {
  console.error('Error del servicio de datos', { status, error: original });
}

export function unwrap<T>(result: { data?: T; error?: unknown; response?: Response }): T {
  if (result.error !== undefined || result.data === undefined) {
    const body = result.error as { error?: { code?: string; message?: string } } | undefined;
    const status = result.response?.status;
    const original = body?.error?.message ?? result.error ?? 'Respuesta vacía del servicio';
    reportApiError(status, original);
    const error = new Error(apiErrorMessage(status)) as Error & { apiStatus?: number };
    if (status !== undefined) error.apiStatus = status;
    throw error;
  }
  return result.data;
}
