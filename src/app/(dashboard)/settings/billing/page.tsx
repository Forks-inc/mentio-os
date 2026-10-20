import type { LedgerList, UsageBreakdown, Wallet } from '@mentio-dev/sdk';
import Link from 'next/link';
import { Badge, Field, Input, LinkButton, Notice, OffsetPager, PageHeader, RangeLinks, Select } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isOneOf } from '@/lib/form';
import { compact, date, day, money, platformName } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { one, withParams, type SearchParams } from '@/lib/params';
import { cn } from '@/lib/utils';
import { topUpAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Facturación' };

const PATH = '/settings/billing';
const DIMENSIONS = ['keyword', 'group', 'platform', 'day'] as const satisfies readonly UsageBreakdown['by'][];
const RANGES = ['7d', '30d', '90d'] as const;
const PAGE = 50;
/** The rail's card titles are a step smaller than the balance and the ledger. */
const RAIL_TITLE = 'text-sm font-semibold';

const LEDGER_LABEL: Record<LedgerList['data'][number]['kind'], string> = {
  signup_credit: 'Saldo de bienvenida',
  topup: 'Recarga',
  refund: 'Reembolso',
  debit_keyword_days: 'Términos monitoreados',
  debit_mentions: 'Menciones',
  adjustment: 'Ajuste',
};

const invoiceStatus = (status: string) => ({ paid: 'Pagada', refunded: 'Reembolsada', open: 'Pendiente', pending: 'Pendiente', failed: 'Fallida', void: 'Anulada' })[status as 'paid' | 'refunded' | 'open' | 'pending' | 'failed' | 'void'] ?? 'Otro estado';

const signed = (cents: number) => `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${money(Math.abs(cents))}`;

/** The last `n` months, newest first, as [YYYY-MM, "Sep 2026"]. */
function lastMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return [d.toISOString().slice(0, 7), new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)] as const;
  });
}

/** The balance after each entry, walking back from today's (first page only). */
function runningBalances(entries: LedgerList['data'], balanceCents: number) {
  let balance = balanceCents;
  return entries.map((entry) => {
    const after = balance;
    balance -= entry.amountCents;
    return after;
  });
}

/**
 * The prepaid wallet: the
 * balance and what burns it, the ledger under it, a rail to add funds with
 * auto recharge and receipts, and the cost per keyword at the foot.
 */
export default async function Billing({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const byParam = one(params, 'by');
  const by = isOneOf(DIMENSIONS, byParam) ? byParam : 'keyword';
  const rangeParam = one(params, 'range');
  const range = isOneOf(RANGES, rangeParam) ? rangeParam : '30d';
  const monthParam = one(params, 'month');
  const month = monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : undefined;
  const offset = Math.max(0, Number(one(params, 'offset')) || 0);
  const cursor = one(params, 'ledger');

  const api = mentio();
  const [wallet, breakdown, ledger, invoices] = await Promise.all([
    api.getWallet().then(unwrap),
    api
      .getUsageBreakdown({ query: { by, ...(month ? { month } : { range }), limit: PAGE, offset } })
      .then((r) => ({ report: unwrap(r), error: null }))
      .catch((error: unknown) => ({ report: null, error: error instanceof Error ? error.message : 'No se pudo cargar el desglose.' })),
    api.listLedger({ query: { limit: 25, ...(cursor ? { cursor } : {}) } }).then(unwrap),
    // Receipts live with the payment provider; the rest of the page works without them.
    api.listInvoices().then(unwrap).catch(() => ({ data: [] })),
  ]);

  return (
    <div>
      <PageHeader title="Facturación" description="Saldo prepagado con cargos diarios. Sin planes ni suscripción." />

      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_22rem] @4xl:grid-rows-[auto_1fr] @4xl:items-start">
        <BalanceCard wallet={wallet} />

        <div className="grid gap-4 @4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1">
          <Card>
            <CardHeader>
              <CardTitle className={RAIL_TITLE}>Recargar saldo</CardTitle>
            </CardHeader>
            <CardContent>
              {wallet.billingConfigured ? (
                <ActionForm action={topUpAction} className="grid gap-4">
                  <Field label="Monto en USD" hint={`Desde ${money(wallet.minTopUpCents)} hasta ${money(wallet.maxTopUpCents)}. Podrás cambiarlo al completar el pago.`}>
                    <Input type="number" name="amount" inputMode="decimal" required min={wallet.minTopUpCents / 100} max={wallet.maxTopUpCents / 100} step="any" defaultValue={wallet.defaultTopUpCents / 100} className="max-w-40 tabular-nums" />
                  </Field>
                  <div>
                    <SubmitButton>Agregar saldo</SubmitButton>
                  </div>
                </ActionForm>
              ) : (
                <p className="text-sm text-muted-foreground">La facturación no está configurada en esta instalación, así que no puedes agregar saldo aquí.</p>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">USD 5 por término monitoreado al mes y USD 0.008 por mención coincidente; se cobra a diario.</CardFooter>
          </Card>

          {wallet.autoRecharge.available ? (
            <Card>
              <CardHeader>
                  <CardTitle className={RAIL_TITLE}>Recarga automática</CardTitle>
                  <CardDescription className="text-xs">Agrega saldo desde una tarjeta guardada. Solo una persona propietaria puede cambiar este ajuste desde el panel de administración.</CardDescription>
                <CardAction>
                  <Badge tone={wallet.autoRecharge.enabled ? 'good' : 'neutral'}>{wallet.autoRecharge.enabled ? 'Activada' : 'Desactivada'}</Badge>
                </CardAction>
              </CardHeader>
              {wallet.autoRecharge.enabled ? (
                <CardContent className="grid gap-1 text-sm">
                  <p>
                    Agrega {money(wallet.autoRecharge.amountCents)} cuando el saldo baja de {money(wallet.autoRecharge.thresholdCents)}.
                  </p>
                  {wallet.autoRecharge.lastRunAt ? <p className="text-xs text-muted-foreground">Último cargo: {date(wallet.autoRecharge.lastRunAt)}</p> : null}
                  {wallet.autoRecharge.lastError ? <p className="text-xs text-destructive">Falló el último intento: {wallet.autoRecharge.lastError}</p> : null}
                </CardContent>
              ) : null}
            </Card>
          ) : null}

          {invoices.data.length ? (
            <Card className="overflow-hidden py-0">
              <CardHeader className="pt-4">
                  <CardTitle className={RAIL_TITLE}>Facturas</CardTitle>
                  <CardDescription className="text-xs">Una por cada recarga pagada; impuestos incluidos.</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="pr-4 text-right">
                      <span className="sr-only">Factura</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.data.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="pl-4">
                        <div className="grid justify-items-start gap-1">
                          <span>{date(inv.createdAt)}</span>
                          <Badge tone={inv.paid ? 'good' : 'warn'}>{invoiceStatus(inv.status)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: inv.currency.toUpperCase() }).format(inv.totalAmount / 100)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {inv.paid ? (
                          <Button variant="ghost" size="sm" nativeButton={false} render={<a href={`${PATH}/invoices/${encodeURIComponent(inv.id)}`} target="_blank" rel="noreferrer" />}>
                            Ver factura
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : null}
        </div>

        <LedgerCard ledger={ledger} balances={cursor ? null : runningBalances(ledger.data, wallet.balanceCents)} params={params} cursor={cursor} />
      </div>

      <Card className="mt-4 overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>Desglose de costos</CardTitle>
          <CardDescription className="text-xs">
            {breakdown.report ? `${day(breakdown.report.window.from)} al ${day(breakdown.report.window.to)}, a precio de lista.` : 'Costo por término monitoreado, campaña o plataforma.'}
          </CardDescription>
          <CardAction className="flex flex-wrap items-center justify-end gap-2">
            <RangeLinks current={by} options={DIMENSIONS} href={(v) => withParams(PATH, params, { by: v, offset: undefined })} />
            <RangeLinks current={month ? '' : range} options={RANGES} href={(v) => withParams(PATH, params, { range: v, month: undefined, offset: undefined })} />
            <form method="get" action={PATH} className="flex items-center gap-1">
              <input type="hidden" name="by" value={by} />
              <Select name="month" defaultValue={month} placeholder="Mes" options={lastMonths(12)} className="h-7 w-32" aria-label="Mes" />
              <Button type="submit" variant="outline" size="sm">Mostrar</Button>
            </form>
          </CardAction>
        </CardHeader>
        {breakdown.report ? (
          <Breakdown report={breakdown.report} params={params} offset={offset} />
        ) : (
          <CardContent className="pb-4">
          <Notice tone="bad" title="No se pudo cargar el desglose.">{breakdown.error}</Notice>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/** The effective balance, large, and the four figures behind it. */
function BalanceCard({ wallet }: { wallet: Wallet }) {
  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{money(wallet.effectiveBalanceCents)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {wallet.pendingCents > 0
          ? `${money(wallet.balanceCents)} confirmado; ${money(wallet.pendingCents)} pendiente por menciones coincidentes desde el último corte diario.`
            : 'Los términos monitoreados y las menciones se cobran una vez al día.'}
        </p>

        {wallet.stopped ? (
          <Notice tone="bad" title="El monitoreo está en pausa: se agotó el saldo." className="mt-4">
            Hay {wallet.autoMutedKeywords} términos esperando. Al agregar saldo hasta llegar a {money(wallet.resumeCostCents)}, se reanudarán de inmediato.
          </Notice>
        ) : wallet.lowBalance ? (
          <Notice tone="warn" title="El saldo está por agotarse." className="mt-4">
            El monitoreo se detendrá cuando el saldo baje del costo de un día de términos ({money(wallet.nextDayCents)}).
          </Notice>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-y-4 border-t pt-4 @md:grid-cols-4 @md:gap-y-0">
          <Figure className="pl-0" label="Gasto diario" value={money(wallet.burnPerDayCents)} />
          <Figure className="border-l" label="Días restantes" value={wallet.daysLeft === null ? 'Sin gasto' : `${wallet.daysLeft} días`} />
          <Figure className="@max-md:pl-0 @md:border-l" label="Términos monitoreados" value={`${wallet.activeKeywords} activos`} sub={wallet.autoMutedKeywords > 0 ? `${wallet.autoMutedKeywords} en pausa` : undefined} />
          <Figure className="border-l pr-0" label="Costo del próximo día" value={money(wallet.nextDayCents)} />
        </dl>

        {wallet.signupCredit ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Incluye el saldo de bienvenida de {money(wallet.signupCredit.amountCents)}, otorgado el {date(wallet.signupCredit.grantedAt)}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** One figure of the balance strip: a small uppercase label over a value, and an optional muted line. */
function Figure({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className={cn('min-w-0 px-4', className)}>
      <dt className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums">{value}</dd>
      {sub ? <dd className="text-xs text-muted-foreground">{sub}</dd> : null}
    </div>
  );
}

function LedgerCard({ ledger, balances, params, cursor }: { ledger: LedgerList; balances: number[] | null; params: SearchParams; cursor?: string }) {
  return (
    <Card className="@container overflow-hidden py-0 @4xl:col-start-1 @4xl:row-start-2">
      <CardHeader className="pt-4">
        <CardTitle>Movimientos</CardTitle>
        <CardDescription className="text-xs">Cada recarga y cargo diario, del más reciente al más antiguo.</CardDescription>
      </CardHeader>
      {ledger.data.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">Aún no hay movimientos.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Fecha</TableHead>
              <TableHead>Movimiento</TableHead>
              <TableHead className="w-28 text-right">Monto</TableHead>
              {balances ? <TableHead className="hidden w-28 text-right @lg:table-cell">Saldo</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.data.map((entry, i) => (
              <TableRow key={entry.id}>
                <TableCell className="w-28 align-top text-muted-foreground">{entry.day ? day(entry.day) : date(entry.createdAt)}</TableCell>
                <TableCell className="align-top whitespace-normal">
                  <p className="font-medium">{LEDGER_LABEL[entry.kind]}</p>
                  {entry.units !== null ? (
                    <p className="text-xs text-muted-foreground">
                      {compact(entry.units)} {entry.kind === 'debit_mentions' ? 'menciones' : 'días de monitoreo'} cobrados hasta ahora
                    </p>
                  ) : entry.note ? (
                    <p className="text-xs text-muted-foreground">{entry.note}</p>
                  ) : null}
                </TableCell>
                <TableCell className={cn('w-28 text-right align-top tabular-nums', entry.amountCents > 0 && 'font-medium text-emerald-700')}>{signed(entry.amountCents)}</TableCell>
                {balances ? <TableCell className="hidden w-28 text-right align-top text-muted-foreground tabular-nums @lg:table-cell">{money(balances[i] ?? 0)}</TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {cursor || ledger.nextCursor ? (
        <div className="flex gap-2 border-t px-4 py-3">
          {cursor ? <LinkButton href={withParams(PATH, params, { ledger: undefined })} variant="ghost" size="sm">‹ Más recientes</LinkButton> : null}
          {ledger.nextCursor ? <LinkButton href={withParams(PATH, params, { ledger: ledger.nextCursor })} variant="ghost" size="sm">Cargar anteriores</LinkButton> : null}
        </div>
      ) : null}
    </Card>
  );
}

function Breakdown({ report, params, offset }: { report: UsageBreakdown; params: SearchParams; offset: number }) {
  const t = report.totals;
  const rowLabel = (row: UsageBreakdown['data'][number]) => {
    if (report.by === 'platform') return platformName(row.key);
    const removed = row.keyword?.removed || row.group?.removed;
    return (
      <>
        {row.label}
        {removed ? <Badge className="ml-2">Eliminado</Badge> : null}
      </>
    );
  };
  return (
    <>
      <CardContent>
        <dl className="grid grid-cols-2 gap-y-4 border-y py-4 @lg:grid-cols-4 sm:gap-y-0">
          <Figure className="pl-0" label="Total" value={money(t.totalCents)} sub={`${money(t.ledgerDebitCents)} cobrados hasta ahora`} />
          <Figure className="border-l" label="Términos monitoreados" value={money(t.keywordCents)} sub={`${compact(t.keywordDays)} días de monitoreo`} />
          <Figure className="max-sm:pl-0 sm:border-l" label="Menciones" value={money(t.mentionCents)} sub={`${compact(t.billableMentions)} cobradas`} />
          <Figure className="border-l pr-0" label="Coincidencias" value={compact(t.matchedMentions)} sub={t.unclassifiedMentions ? `${compact(t.unclassifiedMentions)} sin clasificar, gratis` : 'Relevantes o no'} />
        </dl>
      </CardContent>
      {report.data.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">No hubo cargos en este periodo.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{report.by === 'day' ? 'Día' : report.by === 'keyword' ? 'Término monitoreado' : report.by === 'group' ? 'Campaña' : 'Plataforma'}</TableHead>
              <TableHead className="text-right">Días de monitoreo</TableHead>
              <TableHead className="text-right">Menciones cobradas</TableHead>
              <TableHead className="text-right">Términos monitoreados</TableHead>
              <TableHead className="text-right">Menciones</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.data.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">
                  {report.by === 'keyword' && row.keyword && !row.keyword.removed ? (
                    <Link href={`/keywords/${row.keyword.id}`} className="hover:underline">{rowLabel(row)}</Link>
                  ) : (
                    rowLabel(row)
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.keywordDays ?? '–'}</TableCell>
                <TableCell className="text-right tabular-nums">{compact(row.billableMentions)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(row.keywordCents)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(row.mentionCents)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{money(row.totalCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div className="px-4">
        <OffsetPager total={report.total} limit={PAGE} offset={offset} href={(o) => withParams(PATH, params, { offset: o ? String(o) : undefined })} />
      </div>
    </>
  );
}
