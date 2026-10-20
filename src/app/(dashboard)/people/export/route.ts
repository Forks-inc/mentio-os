/**
 * The people list as CSV, fetched server side with the same filters as the
 * page (the key stays here) and handed to the browser as a download.
 */
import type { NextRequest } from 'next/server';
import { apiErrorMessage } from '@/lib/action';
import { mentio, reportApiError } from '@/lib/mentio';
import { peopleQuery } from '../filters';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams;
  const params = Object.fromEntries([...new Set(url.keys())].map((key) => [key, url.getAll(key)]));
  const query = peopleQuery(params);
  const result = await mentio().exportPeopleCsv({ query, parseAs: 'text' });
  if (result.error !== undefined || typeof result.data !== 'string') {
    const apiStatus = result.response?.status;
    reportApiError(apiStatus, result.error ?? 'Respuesta vacía del servicio');
    const status = apiStatus && apiStatus >= 400 ? apiStatus : 502;
    const headers: Record<string, string> = { 'content-type': 'text/plain; charset=utf-8' };
    const retry = result.response?.headers.get('retry-after');
    if (retry) headers['retry-after'] = retry;
    return new Response(apiErrorMessage(apiStatus), { status, headers });
  }
  const day = new Date().toISOString().slice(0, 10);
  return new Response(result.data, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="people-${day}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
