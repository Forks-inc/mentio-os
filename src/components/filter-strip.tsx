'use client';

/**
 * Filters as a strip of conditions, the way list apps do it: a dashed
 * "Filter" chip offers the properties a page can narrow by; picking one
 * adds a condition chip ("Platform is Bluesky") to a strip under the
 * toolbar, where its value is a select and an x removes it, with "+" for
 * the next one and Clear for all of them. Every applied filter is visible
 * at once, and nothing is hidden behind a button once set.
 *
 * FilterBar stays the toolbar for pages whose filters are few enough to
 * live inline as selects.
 */
import { Check, ChevronDown, ListFilter, Plus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterProperty {
  key: string;
  label: string;
  icon: LucideIcon;
}

/** The dashed "Filter" chip: a menu of the properties not yet applied. */
export function FilterButton({
  properties,
  onAdd,
  /** Inside the strip it shrinks to a "+" icon. */
  compact = false,
}: {
  properties: FilterProperty[];
  onAdd: (key: string) => void;
  compact?: boolean;
}) {
  if (properties.length === 0 && compact) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={properties.length === 0}
        render={
          compact ? (
            <Button variant="outline" size="icon-sm" aria-label="Agregar filtro" className="border-border bg-background shadow-none" />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-dashed border-border bg-background pl-2 font-normal text-muted-foreground shadow-none hover:border-foreground/25 hover:bg-background hover:text-foreground aria-expanded:border-foreground/25 aria-expanded:bg-background"
            />
          )
        }
      >
        {compact ? (
          <Plus />
        ) : (
          <>
            <ListFilter aria-hidden className="size-3.5" />
            Filtrar
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {properties.map((property) => (
          <DropdownMenuItem key={property.key} onClick={() => onAdd(property.key)}>
            <property.icon className="text-muted-foreground" /> {property.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The panel under the toolbar holding the condition chips. */
export function FilterStrip({
  children,
  addable,
  onAdd,
  onClear,
  className,
}: {
  children: ReactNode;
  /** Properties still available for a new chip. */
  addable: FilterProperty[];
  onAdd: (key: string) => void;
  onClear: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 p-2', className)}>
      {children}
      <FilterButton compact properties={addable} onAdd={onAdd} />
      <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
        Limpiar
      </Button>
    </div>
  );
}

/** One condition: property, "is", a value control, and an x. */
export function FilterChip({
  icon: Icon,
  label,
  operator,
  onRemove,
  children,
}: {
  icon: LucideIcon;
  label: string;
  /** The operator segment; a plain "is" when the filter cannot be negated. */
  operator?: ReactNode;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-8 max-w-full items-stretch overflow-hidden rounded-lg border border-border bg-background text-sm shadow-none">
      <span className="flex shrink-0 items-center gap-1.5 border-r border-border px-2.5 font-medium">
        <Icon aria-hidden className="size-3.5 text-muted-foreground" />
        {label}
      </span>
      {operator ?? <span className="flex shrink-0 items-center border-r border-border px-2 text-muted-foreground">es</span>}
      <span className="flex min-w-0 items-stretch border-r border-border">{children}</span>
      <Button type="button" variant="ghost" aria-label={`Eliminar filtro ${label}`} onClick={onRemove} className={cn(SEGMENT_CLASS, 'px-2 text-muted-foreground')}>
        <X aria-hidden className="size-3.5" />
      </Button>
    </div>
  );
}

/** The operator, switched in place: "is" keeps those values, "is not" drops
 *  them. Two states rather than a menu, so it is one click either way. */
export function FilterChipOperator({ negated, onToggle }: { negated: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onToggle}
      title={negated ? 'Cambiar a es' : 'Cambiar a no es'}
      aria-label={negated ? 'Operador: no es. Cambiar a es' : 'Operador: es. Cambiar a no es'}
      className={cn(SEGMENT_CLASS, 'border-r border-border px-2 text-muted-foreground')}
    >
      {negated ? 'no es' : 'es'}
    </Button>
  );
}

/** Several values in one chip, any of them (or, negated, none of them): a
 *  checklist that stays open while boxes are ticked. */
interface MultiOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

/** Past this many options a flat list stops being scannable and starts running
 *  off the screen (a workspace may track up to 500 keywords), so the dropdown
 *  grows a search field and the list scrolls instead. */
const SEARCHABLE_FROM = 6;

/** How many rows stay visible before the list scrolls: 2rem a row. */
const VISIBLE_ROWS = 6;

/** What the chip reads when it is closed: the chosen labels while they fit,
 *  then a count, and what an empty selection means. `placeholder` says the
 *  text is the empty one, which is what greys it: a value no option matches
 *  (a bookmarked link to a deleted keyword) reads as empty and must look it,
 *  so this is never the same question as "are there values". */
function summarize(
  options: readonly MultiOption[],
  values: readonly string[],
  empty: string,
): { label: string; placeholder: boolean } {
  const chosen = options.filter((option) => values.includes(option.value));
  if (chosen.length === 0) return { label: empty, placeholder: true };
  if (chosen.length <= 2) return { label: chosen.map((option) => option.label).join(', '), placeholder: false };
  return { label: `${chosen.length} seleccionados`, placeholder: false };
}

/** A chip segment is a ghost Button squared into the chip: no radius, full height, normal weight. */
const SEGMENT_CLASS = 'h-auto shrink-0 rounded-none font-normal focus-visible:ring-0 focus-visible:bg-muted';
const TRIGGER_CLASS = cn(SEGMENT_CLASS, 'min-w-0 shrink gap-1 px-2.5');

export function FilterChipMulti({
  options,
  values,
  onChange,
  autoOpen = false,
  empty = 'Seleccionar…',
  name,
  onOpenChange,
}: {
  options: ReadonlyArray<MultiOption>;
  values: readonly string[];
  onChange: (next: string[]) => void;
  autoOpen?: boolean;
  empty?: string;
  /** The filter's own name ("Platform"), which is what a screen reader needs
   *  to hear when the list opens; the trigger only carries the selection. */
  name?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const { label, placeholder } = summarize(options, values, empty);
  // Long lists get a different COMPONENT, so letting the count decide on
  // every render unmounts one and mounts the other the moment the list
  // crosses the threshold: a refetch that brings 6 keywords to 7 used to
  // close the popup mid-selection. The form therefore only changes while
  // the popup is closed, and the popup's own state survives the swap.
  const searchable = options.length > SEARCHABLE_FROM;
  const [open, setOpen] = useState(autoOpen);
  const [withSearch, setWithSearch] = useState(searchable);
  useEffect(() => {
    if (!open && withSearch !== searchable) setWithSearch(searchable);
  }, [open, searchable, withSearch]);

  const changeOpen = (next: boolean): void => {
    setOpen(next);
    onOpenChange?.(next);
  };

  if (withSearch) {
    return (
      <FilterChipSearchMulti
        options={options}
        values={values}
        onChange={onChange}
        open={open}
        onOpenChange={changeOpen}
        label={label}
        placeholder={placeholder}
        name={name}
      />
    );
  }
  return (
    <DropdownMenu open={open} onOpenChange={(next: boolean) => changeOpen(next)}>
      <DropdownMenuTrigger render={<Button type="button" variant="ghost" className={TRIGGER_CLASS} />}>
        <span className={cn('truncate', placeholder && 'text-muted-foreground')}>{label}</span>
        <ChevronDown aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={values.includes(option.value)}
            onCheckedChange={(checked) =>
              onChange(checked ? [...values, option.value] : values.filter((value) => value !== option.value))
            }
          >
            {option.icon}
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The long-list form of the chip above: same trigger, but the popup carries a
 *  search field and a scrolling list. Base UI calls this the input-inside-popup
 *  pattern, so the trigger stays the control and the field only filters. */
function FilterChipSearchMulti({
  options,
  values,
  onChange,
  open,
  onOpenChange,
  label,
  placeholder,
  name,
}: {
  options: ReadonlyArray<MultiOption>;
  values: readonly string[];
  onChange: (next: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  placeholder: boolean;
  name?: string;
}) {
  const items = useMemo(() => options.map((option) => option.value), [options]);
  const byValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);
  const labelOf = (item: string): string => byValue.get(item)?.label ?? item;
  // A stored value whose option is gone (a deleted keyword) stays in the
  // selection so ticking another box does not quietly drop it. It has no row
  // to untick and the chip does not count it, the way the plain list behaves;
  // removing the chip is what clears it.
  const selected = useMemo(() => values.filter((value) => value.length > 0), [values]);

  return (
    <Combobox
      multiple
      items={items}
      value={selected as string[]}
      onValueChange={(next: string[]) => onChange([...next])}
      itemToStringLabel={labelOf}
      filter={(item: string, query: string) => labelOf(item).toLowerCase().includes(query.trim().toLowerCase())}
      open={open}
      onOpenChange={(next: boolean) => onOpenChange(next)}
    >
      <ComboboxTrigger render={<Button type="button" variant="ghost" className={TRIGGER_CLASS} />}>
        <span className={cn('truncate', placeholder && 'text-muted-foreground')}>{label}</span>
      </ComboboxTrigger>
      <ComboboxContent aria-label={name ?? label} className="w-56 min-w-56">
        <ComboboxInput showTrigger={false} placeholder="Buscar…" aria-label="Buscar opciones" />
        <ComboboxEmpty>Sin coincidencias</ComboboxEmpty>
        <ComboboxList className="max-h-(--list-height)" style={{ '--list-height': `${VISIBLE_ROWS * 2}rem` } as CSSProperties}>
          {(item: string) => {
            const option = byValue.get(item);
            return (
              <ComboboxItem key={item} value={item}>
                {option?.icon ? <span className="flex shrink-0 [&_svg]:size-3.5">{option.icon}</span> : null}
                <span className="truncate">{labelOf(item)}</span>
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** The value select of a chip, styled as one of its segments. A chip just
 *  added has no value yet and reads "Select...". */
export function FilterChipSelect({
  items,
  value,
  onValueChange,
  children,
  autoOpen = false,
}: {
  items: Record<string, string>;
  value: string | null;
  onValueChange: (value: string | null) => void;
  children: ReactNode;
  /** Open at once, for a chip the user just added. */
  autoOpen?: boolean;
}) {
  return (
    <Select items={items} value={value} onValueChange={onValueChange} defaultOpen={autoOpen}>
      <SelectTrigger
        size="sm"
        className="h-auto min-w-0 rounded-none border-0 bg-transparent pr-1.5 pl-2.5 hover:bg-muted focus-visible:ring-0 focus-visible:bg-muted dark:bg-transparent dark:hover:bg-muted"
      >
        <SelectValue placeholder="Seleccionar…" className="truncate" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {children}
      </SelectContent>
    </Select>
  );
}

/** A typed value, for a chip with no list to pick from (a tag). Applies on
 *  Enter or when focus leaves; an empty value leaves the chip unset. */
export function FilterChipText({
  value,
  onCommit,
  placeholder,
  autoFocus = false,
  label,
}: {
  value: string | null;
  onCommit: (value: string | null) => void;
  placeholder: string;
  autoFocus?: boolean;
  label: string;
}) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  const commit = () => {
    const next = draft.trim();
    if ((next || null) !== value) onCommit(next || null);
  };
  return (
    <Input
      aria-label={label}
      autoFocus={autoFocus}
      value={draft}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
      }}
      className="h-full w-32 min-w-0 rounded-none border-0 bg-transparent px-2.5 shadow-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-0 md:text-sm"
    />
  );
}

/** A chip whose value came from elsewhere (a link) and is only removable. */
export function FilterChipValue({ children }: { children: ReactNode }) {
  return <span className="flex items-center truncate px-2.5">{children}</span>;
}
