'use client';

/**
 * The shadcn Select for plain forms: it submits its value under `name`
 * (Base UI renders a hidden input), so a server action or a GET form reads
 * it like a native <select>. `placeholder` adds an empty choice that submits ''.
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/lib/utils';

export type SelectOption = readonly [value: string, label: string];

export function FormSelect({
  name,
  options,
  defaultValue,
  placeholder,
  className,
  required,
  disabled,
  id,
  size = 'default',
  'aria-label': ariaLabel,
}: {
  name?: string;
  options: ReadonlyArray<SelectOption>;
  defaultValue?: string | number | readonly string[] | null;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  size?: 'sm' | 'default';
  'aria-label'?: string;
}) {
  const initial = defaultValue === undefined || defaultValue === null || Array.isArray(defaultValue) ? '' : String(defaultValue);
  // Without a placeholder a select always holds a value, like a native one.
  const start = initial === '' && placeholder === undefined ? (options[0]?.[0] ?? null) : initial === '' ? null : initial;
  const items = [...(placeholder !== undefined ? [{ value: null, label: placeholder }] : []), ...options.map(([value, label]) => ({ value, label }))];
  return (
    <Select name={name} items={items} defaultValue={start} required={required} disabled={disabled}>
      <SelectTrigger id={id} size={size} aria-label={ariaLabel} className={cn('w-full bg-background', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {placeholder !== undefined ? <SelectItem value={null}>{placeholder}</SelectItem> : null}
        {options.map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
