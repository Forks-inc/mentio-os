'use client';

/**
 * shadcn controls wired for plain forms: each one submits its value under
 * `name` (a hidden input inside the form, since popups render in a portal
 * outside it), so a server action or a GET form reads them like native
 * fields. Checkbox, CheckboxGroup, MultiSelect (Combobox with chips),
 * Combobox (one value), DatePicker, DateTimePicker.
 */
import { format, isValid, parse } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Checkbox as ShadcnCheckbox } from './checkbox';
import {
  Combobox as ShadcnCombobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from './combobox';
import { Field, FieldContent, FieldDescription, FieldLabel } from './field';
import { Input } from './input';
import { InputGroup, InputGroupInput } from './input-group';
import { Badge } from './badge';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Switch } from './switch';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { PlatformIcon } from '@/components/platform-icon';
import { cn } from '@/lib/utils';

export type Option = readonly [value: string, label: string];

/** One checkbox with its label (and a hint under it). Submits `value` (default "true") when checked. */
export function Checkbox({ name, value = 'true', defaultChecked, label, hint, disabled }: { name: string; value?: string; defaultChecked?: boolean; label: ReactNode; hint?: ReactNode; disabled?: boolean }) {
  return (
    <Field orientation="horizontal">
      <FieldLabel className="items-start font-normal">
        <ShadcnCheckbox name={name} value={value} defaultChecked={defaultChecked} disabled={disabled} className="mt-0.5" />
        <FieldContent className="gap-0.5">
          <span className="font-medium">{label}</span>
          {hint ? <FieldDescription className="text-xs">{hint}</FieldDescription> : null}
        </FieldContent>
      </FieldLabel>
    </Field>
  );
}

/** A row of checkboxes sharing one name; each checked one submits its value. */
export function CheckboxGroup({ name, options, selected }: { name: string; options: ReadonlyArray<Option>; selected: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2.5">
      {options.map(([value, label]) => (
        <FieldLabel key={value} className="font-normal">
          <ShadcnCheckbox name={name} value={value} defaultChecked={selected.includes(value)} />
          {label}
        </FieldLabel>
      ))}
    </div>
  );
}

/** Several values from a list, shown as chips, with a search: shadcn's multiple Combobox. */
export function MultiSelect({ name, options, defaultValues = [], placeholder = 'Pick…', className }: { name: string; options: ReadonlyArray<Option>; defaultValues?: readonly string[]; placeholder?: string; className?: string }) {
  // Keep ids no longer offered (a deleted keyword) so a save does not drop them silently.
  const all = [...options, ...defaultValues.filter((v) => !options.some(([o]) => o === v)).map((v) => [v, v] as const)];
  const labels = new Map(all.map(([v, l]) => [v, l]));
  const [values, setValues] = useState<string[]>([...defaultValues]);
  const anchor = useComboboxAnchor();
  return (
    <>
      {values.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <ShadcnCombobox
        multiple
        autoHighlight
        items={all.map(([v]) => v)}
        value={values}
        onValueChange={(next: string[]) => setValues(next)}
        itemToStringLabel={(v: string) => labels.get(v) ?? v}
      >
        <ComboboxChips ref={anchor} className={cn('w-full bg-background', className)}>
          <ComboboxValue>
            {(chosen: string[]) => (
              <>
                {chosen.map((v) => (
                  <ComboboxChip key={v}>{labels.get(v) ?? v}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder={chosen.length ? '' : placeholder} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>Nothing matches.</ComboboxEmpty>
          <ComboboxList>
            {(v: string) => (
              <ComboboxItem key={v} value={v}>
                {labels.get(v) ?? v}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </ShadcnCombobox>
    </>
  );
}

/** One value from a long list, with a search (a timezone): shadcn's Combobox. */
export function Combobox({ name, options, defaultValue, placeholder, className }: { name: string; options: readonly string[]; defaultValue?: string; placeholder?: string; className?: string }) {
  const [value, setValue] = useState<string | null>(defaultValue ?? null);
  return (
    <>
      <input type="hidden" name={name} value={value ?? ''} />
      <ShadcnCombobox items={options as string[]} value={value} onValueChange={(next: string | null) => setValue(next)} autoHighlight>
        <ComboboxInput placeholder={placeholder} className={cn('w-full bg-background', className)} />
        <ComboboxContent>
          <ComboboxEmpty>Nothing matches.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </ShadcnCombobox>
    </>
  );
}

const DAY = 'yyyy-MM-dd';
const readDay = (value?: string | null) => {
  if (!value) return undefined;
  const d = parse(value.slice(0, 10), DAY, new Date());
  return isValid(d) ? d : undefined;
};

/**
 * A day, picked on shadcn's Calendar in a Popover. Submits YYYY-MM-DD under
 * `name`, or calls `onChange` (a filter chip); `fromDay` is the earliest day offered.
 */
export function DatePicker({
  name,
  defaultValue,
  onChange,
  placeholder = 'Pick a day',
  fromDay,
  className,
  variant = 'outline',
}: {
  name?: string;
  defaultValue?: string | null;
  onChange?: (day: string | undefined) => void;
  placeholder?: string;
  fromDay?: string;
  className?: string;
  variant?: 'outline' | 'ghost';
}) {
  const [day, setDay] = useState<Date | undefined>(readDay(defaultValue));
  const [open, setOpen] = useState(false);
  const min = readDay(fromDay);
  const pick = (next: Date | undefined) => {
    setDay(next);
    setOpen(false);
    onChange?.(next ? format(next, DAY) : undefined);
  };
  return (
    <>
      {name ? <input type="hidden" name={name} value={day ? format(day, DAY) : ''} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button type="button" variant={variant} className={cn('justify-start font-normal', !day && 'text-muted-foreground', className)} />}>
          <CalendarIcon />
          {day ? format(day, 'PP') : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={day} onSelect={pick} defaultMonth={day} captionLayout="dropdown" disabled={min ? { before: min } : undefined} />
          {day ? (
            <div className="border-t p-2">
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => pick(undefined)}>
                Clear
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}

/** A day and a time (a snooze, when an activity happened): shadcn's Calendar and a time Input. Submits YYYY-MM-DDTHH:mm. */
export function DateTimePicker({ name, defaultValue, placeholder = 'Pick a day' }: { name: string; defaultValue?: string; placeholder?: string }) {
  const [day, setDay] = useState<string | undefined>(defaultValue?.slice(0, 10));
  const [time, setTime] = useState(defaultValue?.slice(11, 16) || '09:00');
  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={day ? `${day}T${time}` : ''} />
      <DatePicker defaultValue={day} onChange={setDay} placeholder={placeholder} className="flex-1" />
      <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" className="w-28 bg-background [&::-webkit-calendar-picker-indicator]:hidden" />
    </div>
  );
}

/**
 * Platforms as pills with their logos, the Mentio dashboard's picker: on is
 * tinted, off is greyed. Every platform on submits nothing (the API's "all",
 * so a platform added later is tracked too); otherwise one value per pill.
 */
export function PlatformPicker({ name, options, defaultValue, labels }: { name: string; options: readonly string[]; defaultValue: readonly string[] | null; labels: Record<string, string> }) {
  const [on, setOn] = useState<string[]>(defaultValue && defaultValue.length ? [...defaultValue] : [...options]);
  const all = on.length === options.length;
  return (
    <div className="grid gap-2">
      {all ? null : on.map((p) => <input key={p} type="hidden" name={name} value={p} />)}
      <ToggleGroup
        multiple
        spacing={1.5}
        value={on}
        onValueChange={(next: string[]) => next.length && setOn(options.filter((o) => next.includes(o)))}
        className="flex-wrap"
        aria-label="Platforms"
      >
        {options.map((p) => (
          <ToggleGroupItem
            key={p}
            value={p}
            variant="outline"
            className="h-8 gap-1.5 rounded-full px-3 font-normal text-muted-foreground opacity-55 grayscale hover:opacity-100 hover:grayscale-0 data-pressed:border-primary/40 data-pressed:bg-primary/10 data-pressed:font-medium data-pressed:text-primary data-pressed:opacity-100 data-pressed:grayscale-0"
          >
            <PlatformIcon platform={p} className="size-3.5" />
            {labels[p] ?? p}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        {all ? 'Every platform, including ones added later. Click one to leave it out.' : `${on.length} of ${options.length}. The last one cannot be turned off.`}
      </p>
    </div>
  );
}

/** Several short values typed one by one (terms, handles): Enter or a comma adds a chip, Backspace removes the last. Submits them newline separated. */
export function TokenInput({ name, defaultValue = [], placeholder, max = 50, splitOnComma = true }: { name: string; defaultValue?: readonly string[]; placeholder?: string; max?: number; splitOnComma?: boolean }) {
  const [tokens, setTokens] = useState<string[]>([...defaultValue]);
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const parts = (splitOnComma ? raw.split(',') : [raw]).map((t) => t.trim()).filter(Boolean);
    if (parts.length) setTokens((prev) => [...prev, ...parts.filter((t) => !prev.includes(t))].slice(0, max));
    setDraft('');
  };
  return (
    <InputGroup className="h-auto min-h-9 flex-wrap gap-1 bg-background px-1.5 py-1">
      <input type="hidden" name={name} value={tokens.join('\n')} />
      {tokens.map((t) => (
        <Badge key={t} variant="secondary" className="h-6 gap-0.5 rounded-md pr-0.5 font-normal">
          {t}
          <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${t}`} className="size-5" onClick={() => setTokens((prev) => prev.filter((x) => x !== t))}>
            <X />
          </Button>
        </Badge>
      ))}
      <InputGroupInput
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft.trim() && add(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || (splitOnComma && e.key === ',')) {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && tokens.length) {
            setTokens((prev) => prev.slice(0, -1));
          }
        }}
        placeholder={tokens.length ? '' : placeholder}
        className="h-6 min-w-24 flex-1 px-1"
      />
    </InputGroup>
  );
}

/** A yes/no setting as a bordered row: label and a line of help on the left, shadcn's Switch on the right. Submits `value` when on. */
export function SwitchRow({ name, value = 'true', defaultChecked, label, hint }: { name: string; value?: string; defaultChecked?: boolean; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-3.5 py-3">
      <span className="grid gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch name={name} value={value} defaultChecked={defaultChecked} />
    </label>
  );
}

/**
 * One choice of a few, side by side (Dub's segmented control on shadcn's
 * ToggleGroup), with the chosen option's description under it. Submits the
 * value under `name` like a select.
 */
export function Segmented({ name, options, defaultValue }: { name: string; options: ReadonlyArray<{ value: string; label: string; description?: string }>; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? options[0]?.value ?? '');
  const chosen = options.find((o) => o.value === value);
  return (
    <div className="grid gap-1.5">
      <input type="hidden" name={name} value={value} />
      <ToggleGroup
        value={[value]}
        onValueChange={(next: string[]) => next[0] && setValue(next[0])}
        className="w-full rounded-lg border bg-muted/50 p-1"
        spacing={1}
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} className="h-7 flex-1 rounded-md text-sm font-normal data-pressed:bg-background data-pressed:font-medium data-pressed:shadow-sm">
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {chosen?.description ? <p className="text-xs text-muted-foreground">{chosen.description}</p> : null}
    </div>
  );
}

/**
 * A from/to range in one popover: shadcn's Calendar in range mode over two
 * months (Dub's and Midday's range picker). Reports YYYY-MM-DD days, either
 * end possibly unset; `Clear` empties both.
 */
export function DateRangePicker({ from, to, onChange, className, placeholder = 'Any time' }: { from?: string | null; to?: string | null; onChange: (range: { from?: string; to?: string }) => void; className?: string; placeholder?: string }) {
  const [range, setRange] = useState<{ from?: Date; to?: Date } | undefined>(from || to ? { from: readDay(from), to: readDay(to) } : undefined);
  const [open, setOpen] = useState(false);
  const label = range?.from ? (range.to ? `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}` : `From ${format(range.from, 'MMM d, yyyy')}`) : placeholder;
  const commit = (next: { from?: Date; to?: Date } | undefined) => {
    setRange(next);
    onChange({ from: next?.from ? format(next.from, DAY) : undefined, to: next?.to ? format(next.to, DAY) : undefined });
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button type="button" variant="ghost" className={cn('justify-start font-normal', !range?.from && 'text-muted-foreground', className)} />}>
        <CalendarIcon />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range?.from ? { from: range.from, to: range.to } : undefined}
          defaultMonth={range?.from}
          onSelect={(next) => {
            commit(next ? { from: next.from, to: next.to } : undefined);
            if (next?.from && next?.to) setOpen(false);
          }}
        />
        {range?.from ? (
          <div className="border-t p-2">
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => commit(undefined)}>
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
