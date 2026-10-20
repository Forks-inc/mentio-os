/**
 * A receipt link: asks the API for the short-lived PDF URL of one order and
 * sends the browser there, so the list never renders a link that has expired.
 */
import { NextResponse } from 'next/server';
import { mentio } from '@/lib/mentio';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await mentio().getInvoiceUrl({ path: { id } });
  if (!data?.url) {
    const body = error as { error?: { message?: string } } | undefined;
    return new NextResponse(body?.error?.message ?? 'La factura no está disponible.', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  return NextResponse.redirect(data.url, 307);
}
