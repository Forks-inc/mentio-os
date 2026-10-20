'use client';

/**
 * The toolbar every list page shares: a
 * search that applies as you type, a dashed "Filter" button that adds a
 * condition chip ("Platform is Reddit") to a strip underneath, and a sort.
 * Every change lands in the URL at once (no Apply button), under the API's
 * own parameter names, so the server page reads it like any other link.
 *
 * A page describes its filters as data (`FilterDef`), which is what lets a
 * server component hand them over: icons are named, not passed.
 */
import {
  Bell,
  Bot,
  CalendarDays,
  CircleDashed,
  Flag,
  Folder,
  Gauge,
  Hash,
  Languages,
  Link2,
  Radio,
  Reply,
  Smile,
  Sparkles,
  Star,
  Tag,
  Tags,
  Target,
  UserRound,
  Users,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';
import {
  FilterButton,
  FilterChip,
  FilterChipMulti,
  FilterChipOperator,
  FilterChipSelect,
  FilterChipText,
  FilterChipValue,
  FilterStrip,
} from '@/components/filter-strip';
import { PlatformIcon } from '@/components/platform-icon';
import { SearchInput } from '@/components/search-input';
import { DatePicker, DateRangePicker } from '@/components/ui/form-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const ICONS = { bell: Bell, bot: Bot, calendar: CalendarDays, status: CircleDashed, flag: Flag, folder: Folder, gauge: Gauge, hash: Hash, languages: Languages, link: Link2, platform: Radio, reply: Reply, smile: Smile, sparkles: Sparkles, star: Star, tag: Tag, tags: Tags, target: Target, user: UserRound, users: Users, muted: VolumeX } satisfies Record<string, LucideIcon>;
export type IconName = keyof typeof ICONS;

export type FilterOption = {
  value: string;
  label: string;
  /** Draws the platform's logo next to the label. */
  platform?: string;
  /** A colored dot (sentiment). */
  dot?: string;
};

/** One filter a page offers. */
export type FilterDef = {
  /** The URL param (and the API's): `platforms`, `status`, ... */
  param: string;
  label: string;
  icon: IconName;
} & (
  | {
      /** Any of these values, comma separated in the URL; with `notParam`, "is not" too. */
      kind: 'multi';
      options: FilterOption[];
      notParam?: string;
    }
  | { kind: 'single'; options: FilterOption[] }
  /** A typed value: a comma list (tags, hosts) or a number. */
  | { kind: 'text'; placeholder: string; notParam?: string; operator?: string }
  /** Days: from `param` to `untilParam` (default `until`), or from `param` alone when `untilParam` is null. */
  | { kind: 'dates'; untilParam?: string | null }
  /** Set only by a link (one person, one alert rule): shown, removable, not offered. */
  | { kind: 'fixed'; value: string }
);

const split = (value: string | null) => (value ?? '').split(/[\n,]/).map((v) => v.trim()).filter(Boolean);

const optionIcon = (option: FilterOption): ReactNode =>
  option.platform ? <PlatformIcon platform={option.platform} /> : option.dot ? <span className="size-2 rounded-full" style={{ background: option.dot }} /> : undefined;

type Changes = Record<string, string | string[] | null | undefined>;

/**
 * The chip logic, apart from where the values live: `read` a param, `write`
 * changes (a list is written comma separated). UrlFilters keeps them in the
 * URL, FormFilters in the form. Returns the dashed Filter button and the
 * strip of chips (null while no chip is shown).
 */
function useFilterChips({ filters, read, write, onClear }: { filters: FilterDef[]; read: (param: string) => string | null; write: (changes: Changes) => void; onClear: () => void }) {
  const [pending, setPending] = useState<string[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [negatedDrafts, setNegatedDrafts] = useState<Record<string, boolean>>({});

  const byParam = new Map(filters.map((f) => [f.param, f]));
  const paramsOf = (f: FilterDef) => [f.param, ...('notParam' in f && f.notParam ? [f.notParam] : []), ...(f.kind === 'dates' && f.untilParam !== null ? [f.untilParam ?? 'until'] : [])];
  const hasValue = (f: FilterDef) => paramsOf(f).some((p) => read(p) !== null);
  const negated = (f: FilterDef) => {
    if (!('notParam' in f) || !f.notParam) return false;
    if (read(f.notParam)) return true;
    if (read(f.param)) return false;
    return negatedDrafts[f.param] ?? false;
  };

  const applied = filters.filter(hasValue).map((f) => f.param);
  const chips = [...applied, ...pending.filter((p) => !applied.includes(p) && byParam.has(p))];
  const addable = filters.filter((f) => f.kind !== 'fixed' && !chips.includes(f.param)).map((f) => ({ key: f.param, label: f.label, icon: ICONS[f.icon] }));

  const add = (param: string) => {
    setPending((prev) => [...prev, param]);
    setJustAdded(param);
  };
  const remove = (f: FilterDef) => {
    setPending((prev) => prev.filter((p) => p !== f.param));
    setNegatedDrafts((prev) => ({ ...prev, [f.param]: false }));
    write(Object.fromEntries(paramsOf(f).map((p) => [p, undefined])));
  };
  const clear = () => {
    setPending([]);
    onClear();
  };
  const writeList = (f: FilterDef, values: string[], not: boolean) => {
    if ('notParam' in f && f.notParam) write({ [f.param]: not ? undefined : values, [f.notParam]: not ? values : undefined });
    else write({ [f.param]: values });
  };
  const listOf = (f: FilterDef, not: boolean) => split(read(not && 'notParam' in f && f.notParam ? f.notParam : f.param));
  const closed = (param: string) => (open: boolean) => {
    if (!open && justAdded === param) setJustAdded(null);
  };


  const button = filters.some((f) => f.kind !== 'fixed') ? <FilterButton properties={addable} onAdd={add} /> : null;
  const strip =
    chips.length > 0 ? (
        <FilterStrip addable={addable} onAdd={add} onClear={clear}>
          {chips.map((param) => {
            const f = byParam.get(param)!;
            const autoOpen = justAdded === param;
            const not = negated(f);
            const toggle =
              'notParam' in f && f.notParam ? (
                <FilterChipOperator
                  negated={not}
                  onToggle={() => {
                    setNegatedDrafts((prev) => ({ ...prev, [f.param]: !not }));
                    writeList(f, listOf(f, not), !not);
                  }}
                />
              ) : undefined;
            const plain = (text: string) => <span className="flex shrink-0 items-center border-r border-border px-2 text-muted-foreground">{text}</span>;
            const chip = (children: ReactNode, operator?: ReactNode) => (
              <FilterChip key={param} icon={ICONS[f.icon]} label={f.label} operator={operator} onRemove={() => remove(f)}>
                {children}
              </FilterChip>
            );
            switch (f.kind) {
              case 'multi':
                return chip(
                  <FilterChipMulti
                    options={f.options.map((o) => ({ value: o.value, label: o.label, icon: optionIcon(o) }))}
                    values={listOf(f, not)}
                    autoOpen={autoOpen}
                    name={f.label}
                empty={`Cualquier ${f.label.toLowerCase()}`}
                    onChange={(next) => writeList(f, next, not)}
                    onOpenChange={closed(param)}
                  />,
                  toggle,
                );
              case 'single':
                return chip(
                  <FilterChipSelect items={Object.fromEntries(f.options.map((o) => [o.value, o.label]))} value={read(f.param)} autoOpen={autoOpen} onValueChange={(value) => write({ [f.param]: value ?? undefined })}>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {optionIcon(o)}
                        {o.label}
                      </SelectItem>
                    ))}
                  </FilterChipSelect>,
                );
              case 'text':
                return chip(
                  <FilterChipText label={f.label} placeholder={f.placeholder} value={listOf(f, not).join(', ') || null} autoFocus={autoOpen} onCommit={(next) => writeList(f, split(next), not)} />,
                  toggle ?? (f.operator ? plain(f.operator) : undefined),
                );
              case 'dates': {
                const until = f.untilParam === null ? null : (f.untilParam ?? 'until');
                if (!until) {
                  return chip(
                    <DatePicker variant="ghost" placeholder="Elegir una fecha" defaultValue={read(f.param)} onChange={(value) => write({ [f.param]: value })} className="h-full rounded-none px-2 font-normal" />,
                    plain('desde'),
                  );
                }
                return chip(
                  <DateRangePicker
                    from={read(f.param)}
                    to={read(until)}
                    onChange={({ from, to }) => write({ [f.param]: from, [until]: to })}
                    className="h-full rounded-none px-2"
                  />,
                  plain('entre'),
                );
              }
              case 'fixed':
                return chip(<FilterChipValue>{f.value}</FilterChipValue>);
            }
          })}
        </FilterStrip>
    ) : null;
  return { button, strip };
}

export function UrlFilters({
  filters,
  search,
  sort,
  leading,
  actions,
  keep = [],
  reset = ['offset', 'cursor'],
  className,
}: {
  filters: FilterDef[];
  search?: { param?: string; placeholder: string };
  /** The order control on the right; the first option is the default and leaves the URL clean. */
  sort?: { param?: string; options: FilterOption[] };
  /** Controls before the search (a view picker). */
  leading?: ReactNode;
  /** Buttons after the Filter button (Save view). */
  actions?: ReactNode;
  /** Params that Clear leaves alone (the view a page is narrowing). */
  keep?: string[];
  /** Params dropped on every change: a filtered list starts on its first page. */
  reset?: string[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const go = (next: URLSearchParams) => {
    const query = next.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };
  const setParams = (changes: Changes) => {
    const next = new URLSearchParams(params.toString());
    for (const key of reset) next.delete(key);
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key);
      const list = Array.isArray(value) ? value : value ? [value] : [];
      if (list.length) next.set(key, list.join(','));
    }
    go(next);
  };
  const { button, strip } = useFilterChips({
    filters,
    read: (param) => params.get(param),
    write: setParams,
    onClear: () => {
      const next = new URLSearchParams();
      for (const key of [search?.param ?? 'q', sort?.param ?? 'sort', ...keep]) {
        const value = params.get(key);
        if (value) next.set(key, value);
      }
      go(next);
    },
  });

  const sortParam = sort?.param ?? 'sort';
  const sortValue = params.get(sortParam) ?? sort?.options[0]?.value ?? '';

  return (
    <div className={className ?? 'mb-5 grid gap-2'}>
      <div className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center">
        {leading}
        {search ? (
          <SearchInput
            className="min-w-0 flex-1 @2xl:w-64 @2xl:flex-none"
            placeholder={search.placeholder}
            value={params.get(search.param ?? 'q') ?? undefined}
            onChange={(q) => setParams({ [search.param ?? 'q']: q })}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {button}
          {actions}
          {sort ? (
            <div className="ml-auto">
              <Select
                items={Object.fromEntries(sort.options.map((o) => [o.value, o.label]))}
                value={sortValue}
                onValueChange={(value) => setParams({ [sortParam]: value && value !== sort.options[0]?.value ? String(value) : undefined })}
              >
                <SelectTrigger size="sm" className="min-w-40 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="end">
                  {sort.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </div>
      {strip}
    </div>
  );
}

/**
 * The same chips inside a form (a segment, a view, an alert rule): the values
 * live in the form and submit as hidden fields under each param, comma
 * separated, which the server action reads like the list pages read the URL.
 */
export function FormFilters({ filters, defaults, empty = 'Aún no hay condiciones.' }: { filters: FilterDef[]; defaults: Record<string, string>; empty?: string }) {
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const { button, strip } = useFilterChips({
    filters,
    read: (param) => values[param] ?? null,
    write: (changes) =>
      setValues((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(changes)) {
          const list = Array.isArray(value) ? value : value ? [value] : [];
          if (list.length) next[key] = list.join(',');
          else delete next[key];
        }
        return next;
      }),
    onClear: () => setValues({}),
  });
  return (
    <div className="grid gap-2">
      {Object.entries(values).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {strip ?? (
        <div className="flex items-center gap-3">
          {button}
          <span className="text-sm text-muted-foreground">{empty}</span>
        </div>
      )}
    </div>
  );
}

/** Platforms as a row of logo toggles (the Overview): shadcn's ToggleGroup, several at once, kept in `param`. */
export function PlatformToggles({ platforms, param = 'platforms' }: { platforms: ReadonlyArray<{ value: string; label: string }>; param?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const value = split(params.get(param));
  return (
    <ToggleGroup
      multiple
      variant="outline"
      size="sm"
      spacing={1}
      value={value}
      onValueChange={(next: string[]) => {
        const query = new URLSearchParams(params.toString());
        if (next.length) query.set(param, next.join(','));
        else query.delete(param);
        startTransition(() => router.replace(query.size ? `${pathname}?${query}` : pathname, { scroll: false }));
      }}
      className="flex-wrap"
    >
      {platforms.map((p) => (
        <Tooltip key={p.value}>
          <TooltipTrigger render={<ToggleGroupItem value={p.value} aria-label={p.label} className={cn('size-7 p-0', value.length && !value.includes(p.value) && 'opacity-50')} />}>
            <PlatformIcon platform={p.value} />
          </TooltipTrigger>
          <TooltipContent>{p.label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
