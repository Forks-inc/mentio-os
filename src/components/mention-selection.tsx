'use client';

/**
 * Selecting mentions in the table and acting on them together: a checkbox
 * per row and in the header, and a bar that floats at the bottom while
 * something is selected (Midday's bulk bar).
 */
import { Check, CircleSlash, RotateCcw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, useTransition, type ReactNode } from 'react';
import { toast } from 'sonner';
import { setStatusMany } from '@/app/(dashboard)/mentions/actions';
import { announceStatus } from '@/components/mention-status';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type Selection = { ids: string[]; selected: Set<string>; toggle: (id: string) => void; setAll: (on: boolean) => void };
const SelectionContext = createContext<Selection | null>(null);

export function MentionSelection({ ids, children }: { ids: string[]; children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const value: Selection = {
    ids,
    selected,
    toggle: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    setAll: (on) => setSelected(on ? new Set(ids) : new Set()),
  };
  const act = (status: 'open' | 'done' | 'ignored') =>
    startTransition(async () => {
      const chosen = [...selected];
      announceStatus(chosen, status);
      const result = await setStatusMany(chosen, status);
      if (result?.error) {
        announceStatus(chosen, null);
        toast.error(result.error);
      } else {
        toast.success(result?.ok ?? 'Resuelto');
        setSelected(new Set());
      }
      router.refresh();
    });

  return (
    <SelectionContext.Provider value={value}>
      {children}
      {selected.size > 0 ? (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div role="toolbar" aria-label="Menciones seleccionadas" className="flex h-12 min-w-0 items-center gap-1 rounded-xl border bg-popover/85 px-2 pl-4 shadow-lg backdrop-blur-lg">
            <span className="mr-2 text-sm font-medium tabular-nums">{selected.size} seleccionadas</span>
            <Button size="sm" disabled={pending} onClick={() => act('done')}>
              <Check /> Marcar como resueltas
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => act('ignored')}>
              <CircleSlash /> Ignorar
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => act('open')}>
              <RotateCcw /> Reabrir
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Limpiar selección" onClick={() => value.setAll(false)}>
              <X />
            </Button>
          </div>
        </div>
      ) : null}
    </SelectionContext.Provider>
  );
}

export function SelectAll() {
  const s = useContext(SelectionContext);
  if (!s) return null;
  const all = s.ids.length > 0 && s.selected.size === s.ids.length;
  return <Checkbox aria-label="Seleccionar todo" checked={all} indeterminate={s.selected.size > 0 && !all} onCheckedChange={(on: boolean) => s.setAll(on)} className="relative z-10" />;
}

export function SelectRow({ id }: { id: string }) {
  const s = useContext(SelectionContext);
  if (!s) return null;
  return <Checkbox aria-label="Seleccionar" checked={s.selected.has(id)} onCheckedChange={() => s.toggle(id)} className="relative z-10" />;
}
