'use client';

import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DEFAULT_DELAY_MS = 300;

/**
 * Search box that applies as you type. Keystrokes are debounced, Enter
 * applies at once, and an outside change to `value` (Clear filters, browser
 * navigation) replaces whatever is being typed. Trims, and reports an empty
 * box as undefined so the URL drops the parameter instead of carrying `q=`.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  delayMs = DEFAULT_DELAY_MS,
}: {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  placeholder: string;
  className?: string;
  delayMs?: number;
}) {
  const [draft, setDraft] = useState(value ?? '');
  const committed = useRef(value ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const outside = value ?? '';
    if (outside !== committed.current) {
      committed.current = outside;
      setDraft(outside);
    }
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const commit = (raw: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const next = raw.trim();
    if (next === committed.current) return;
    committed.current = next;
    onChange(next || undefined);
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        data-search=""
        className="h-8 pl-8"
        placeholder={placeholder}
        value={draft}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => commit(raw), delayMs);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value);
        }}
      />
    </div>
  );
}
