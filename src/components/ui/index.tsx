/**
 * The dashboard's kit: shadcn/ui components (the other files in this folder,
 * add more with `npx shadcn add <name>`) composed into the few shapes every
 * page repeats. Server-rendered; interactive pieces live in client.tsx,
 * form controls in form-controls.tsx, charts in components/charts.tsx.
 * Restyling the app is editing the theme in globals.css, or these.
 */
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CircleAlert, Inbox, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from './alert';
import { Badge as ShadcnBadge } from './badge';
import { Kbd } from './kbd';
import { buttonVariants } from './button-variants';
import { Card as ShadcnCard, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { LinkToggle } from './client';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty';
import { Field as ShadcnField, FieldDescription, FieldLabel, FieldTitle } from './field';
import { FormSelect, type SelectOption } from './form-select';
import { Input as ShadcnInput } from './input';
import { Table as ShadcnTable, TableBody, TableHead, TableHeader, TableRow } from './table';
import { Textarea as ShadcnTextarea } from './textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { Sparkline } from '../charts';

export { BarList, LineChart, Sparkline, StackedBars } from '../charts';
export { CHART_COLORS, OTHER_COLOR } from '@/lib/chart-colors';
export { TableCell, TableRow } from './table';
export { Checkbox, CheckboxGroup, Combobox, DatePicker, DateTimePicker, MultiSelect, PlatformPicker, Segmented, SwitchRow, TokenInput } from './form-controls';

/** Class names, later ones winning: shadcn's `cn` under its older name here. */
export const cx = cn;

export function PageHeader({ title, description, actions, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-6">
      {back ? (
        <Link href={back.href} data-slot="back-link" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">‹ {back.label}</Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Card({ title, description, actions, children, className }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <ShadcnCard className={className}>
      {title || actions ? (
        <CardHeader>
          {title ? <CardTitle className="text-sm font-semibold">{title}</CardTitle> : null}
          {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
          {actions ? <CardAction className="text-xs">{actions}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </ShadcnCard>
  );
}

/** A number on a small card: its label, the change in percent (colored), a sparkline, a hint. */
export function Stat({ label, value, hint, href, delta, spark, invert = false }: { label: string; value: ReactNode; hint?: ReactNode; href?: string; delta?: number | null; spark?: number[]; invert?: boolean }) {
  const good = delta === null || delta === undefined ? null : invert ? delta <= 0 : delta >= 0;
  const card = (
    <ShadcnCard size="sm" className={cn('h-full gap-1', href && 'transition-shadow group-hover/stat:ring-foreground/20')}>
      <CardHeader className="grid-cols-[1fr_auto]">
        <CardDescription className="text-xs">{label}</CardDescription>
        {delta === null || delta === undefined ? null : (
          <CardAction className={cn('text-xs font-medium tabular-nums', good ? 'text-emerald-600' : 'text-destructive')}>
            {delta > 0 ? '+' : ''}
            {Math.round(delta)}%
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums">{value}</CardTitle>
          {spark && spark.length > 1 ? <Sparkline values={spark} tone={good === false ? 'bad' : 'accent'} /> : null}
        </div>
        {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </ShadcnCard>
  );
  return href ? <Link href={href} className="group/stat block">{card}</Link> : card;
}

/** Badge tones over shadcn's Badge. */
const TONES = {
  neutral: 'bg-secondary text-secondary-foreground',
  accent: 'bg-brand-soft text-primary',
  solid: '',
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: '',
  outline: '',
} as const;
export type Tone = keyof typeof TONES;
const BADGE_VARIANT = { solid: 'default', bad: 'destructive', outline: 'outline' } as const;

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const variant = tone in BADGE_VARIANT ? BADGE_VARIANT[tone as keyof typeof BADGE_VARIANT] : 'secondary';
  return <ShadcnBadge variant={variant} className={cn(TONES[tone], className)}>{children}</ShadcnBadge>;
}

/**
 * A filter in a list row, kept to one line: the first `max` conditions as
 * badges, then "+N more" with every condition in a tooltip.
 */
export function Conditions({ conditions, max = 2, empty = 'Todo' }: { conditions: string[]; max?: number; empty?: string }) {
  if (conditions.length === 0) return <span className="text-xs text-muted-foreground">{empty}</span>;
  const rest = conditions.length - max;
  return (
    <span className="flex max-w-full flex-wrap items-center gap-1">
      {conditions.slice(0, max).map((c, i) => (
        <Badge key={`${c}-${i}`} tone="outline" className="max-w-56 justify-start font-normal"><span className="truncate">{c}</span></Badge>
      ))}
      {rest > 0 ? (
        <Tooltip>
          <TooltipTrigger render={<span className="cursor-default" />}>
            <Badge tone="neutral" className="font-normal">+{rest} más</Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <ul className="space-y-0.5">
              {conditions.map((c, i) => <li key={`${c}-${i}`}>{c}</li>)}
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}

export const sentimentTone = (s?: string | null): Tone => (s === 'positive' ? 'good' : s === 'negative' ? 'bad' : 'neutral');

/** The kit's button names, mapped onto shadcn's Button variants. */
const VARIANTS = { primary: 'default', secondary: 'outline', danger: 'destructive', ghost: 'ghost' } as const;
export type ButtonVariant = keyof typeof VARIANTS;
/** shadcn's button look for a link or an <a> (a server component cannot render the client Button with an href). */
export const buttonClass = (variant: ButtonVariant = 'secondary', size: 'sm' | 'md' = 'md', className?: string) =>
  buttonVariants({ variant: VARIANTS[variant], size: size === 'sm' ? 'sm' : 'default', className });

export function LinkButton({ href, variant = 'secondary', size = 'md', children, className, create = false, ...rest }: { href: string; variant?: ButtonVariant; size?: 'sm' | 'md'; children: ReactNode; className?: string; /** The page's create action: pressed by the C shortcut, which it shows. */ create?: boolean } & Omit<ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} data-create={create ? '' : undefined} {...rest}>
      {children}
      {create ? <Kbd className="ml-1 hidden bg-primary-foreground/20 text-current md:inline-flex">C</Kbd> : null}
    </Link>
  );
}

/** shadcn's Empty, laid out like Zernio's: an icon in a circle, a title, a line of help, one action. */
export function EmptyState({ title, children, icon: Icon = Inbox, action }: { title: ReactNode; children?: ReactNode; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <Empty className="rounded-lg border border-dashed bg-card py-12">
      <EmptyHeader>
        <EmptyMedia className="mb-3 flex size-14 items-center justify-center rounded-2xl border bg-muted/50">
          <Icon className="size-6 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-base font-medium">{title}</EmptyTitle>
        {children ? <EmptyDescription className="max-w-sm text-sm text-balance">{children}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

/** A message in the page (a paused wallet, a failed read, a secret shown once): shadcn's Alert. */
export function Notice({ tone = 'info', title, children, action, className }: { tone?: 'info' | 'warn' | 'bad'; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  const Icon = tone === 'bad' ? CircleAlert : tone === 'warn' ? TriangleAlert : Info;
  return (
    <Alert variant={tone === 'bad' ? 'destructive' : 'default'} className={cn('px-4 py-3', tone === 'warn' && 'border-amber-300 bg-amber-50/60 text-amber-900 *:data-[slot=alert-description]:text-amber-800', className)}>
      <Icon />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children ? <AlertDescription>{children}</AlertDescription> : null}
      {action ? <AlertAction>{action}</AlertAction> : null}
    </Alert>
  );
}

/**
 * A labelled form row: shadcn's Field. The label wraps a single control so a
 * click focuses it; `group` is for a set of controls with labels of their
 * own (a CheckboxGroup), which a label must not wrap.
 */
export function Field({ label, hint, children, className, group = false }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string; group?: boolean }) {
  return (
    <ShadcnField className={cn('gap-1.5', className)} role={group ? 'group' : undefined}>
      {group ? (
        <>
          <FieldTitle>{label}</FieldTitle>
          {children}
        </>
      ) : (
        <FieldLabel className="flex-col items-stretch gap-1.5 *:first:font-medium">
          <span>{label}</span>
          {children}
        </FieldLabel>
      )}
      {hint ? <FieldDescription className="text-xs">{hint}</FieldDescription> : null}
    </ShadcnField>
  );
}

export function Input(props: ComponentProps<'input'>) {
  return <ShadcnInput {...props} className={cn('bg-background font-normal', props.className)} />;
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return <ShadcnTextarea rows={4} {...props} className={cn('bg-background font-normal', props.className)} />;
}

/** A select for forms (shadcn, submits under `name`); `placeholder` is the empty choice. */
export function Select({ options, placeholder, name, defaultValue, className, required, disabled, id, 'aria-label': ariaLabel }: {
  options: ReadonlyArray<SelectOption>;
  placeholder?: string;
  name?: string;
  defaultValue?: string | number | readonly string[];
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}) {
  return <FormSelect name={name} options={options} placeholder={placeholder} defaultValue={defaultValue} className={cn('font-normal', className)} required={required} disabled={disabled} id={id} aria-label={ariaLabel} />;
}

/**
 * A data table (shadcn's) in a card: pass header labels and rows of cells.
 * A row's main link carries `data-row-link` and `rowLink`, which stretch it
 * over the whole row, so a click anywhere opens the record (a drawer); the
 * row's other links, buttons and forms stay clickable above it.
 */
export const rowLink = 'after:absolute after:inset-0';
const ROW_CLICK =
  '[&_tbody_tr]:relative [&_tbody_tr:has([data-row-link])]:cursor-pointer [&_td_a:not([data-row-link])]:relative [&_td_a:not([data-row-link])]:z-10 [&_td_button]:relative [&_td_button]:z-10 [&_td_form]:relative [&_td_form]:z-10';

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className={cn('overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10', ROW_CLICK)}>
      <ShadcnTable>
        <TableHeader>
          <TableRow>{head.map((h, i) => <TableHead key={i} className="h-9 text-[11px]">{h}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </ShadcnTable>
      {empty}
    </div>
  );
}
export const td = 'px-4 py-2.5 align-middle whitespace-normal first:pl-5 last:pr-5';
/** A numeric cell: right-aligned, monospaced digits. */
export const tdNum = 'px-4 py-2.5 text-right align-middle font-mono tabular-nums whitespace-nowrap first:pl-5 last:pr-5';

/** Previous/next links for offset lists ({ data, total }). */
export function OffsetPager({ total, limit, offset, href }: { total: number; limit: number; offset: number; href: (offset: number) => string }) {
  if (total <= limit) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>{offset + 1} a {Math.min(offset + limit, total)} de {total}</span>
      <div className="flex gap-2">
        {offset > 0 ? <LinkButton href={href(Math.max(0, offset - limit))} size="sm">‹ Anterior</LinkButton> : null}
        {offset + limit < total ? <LinkButton href={href(offset + limit)} size="sm">Siguiente ›</LinkButton> : null}
      </div>
    </div>
  );
}

/** A window switch (7d, 30d, ...): shadcn's ToggleGroup, each choice a link that keeps the rest of the URL. */
export function RangeLinks({ current, options, href }: { current: string; options: readonly string[]; href: (value: string) => string }) {
  return <LinkToggle current={current} items={options.map((value) => ({ value, label: value, href: href(value) }))} />;
}
