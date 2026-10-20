/**
 * GET /mentions/export?<the feed's filters>: the same mentions as a CSV
 * download. The API call happens here, on the server, so the key never
 * reaches the browser; the file is passed through as it arrives.
 */
import { mentio } from '@/lib/mentio';
import { getterFromParams, parseFilters, toSearchQuery } from '../filters';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string[]> = {};
  for (const [key, value] of url.searchParams) (params[key] ??= []).push(value);
  const viewId = url.searchParams.get('viewId') || undefined;
  // The export takes the search filters, but no order, cursor or page size.
  const { sort: _sort, cursor: _cursor, limit: _limit, ...query } = toSearchQuery(parseFilters(getterFromParams(params)), { viewId });

  const result = await mentio().exportMentionsCsv({ query, parseAs: 'stream' });
  const status = result.response?.status ?? 502;
  const file = result.response?.body;
  if (result.error !== undefined || !file) {
    const body = result.error as { error?: { message?: string } } | undefined;
    const message = body?.error?.message ?? 'No se pudo exportar el archivo.';
    return new Response(message, { status: status >= 400 ? status : 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const day = new Date().toISOString().slice(0, 10);
  // parseAs 'stream' leaves the body unread: hand it straight to the browser.
  return new Response(file, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="menciones-${day}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
