'use client';

/**
 * A mention's status in the table, updated the moment it is triaged (Dub and
 * Midday update optimistically): the row menu and the bulk bar announce the
 * change, every badge for that mention follows at once, and the server's
 * refresh confirms it a moment later.
 */
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

const EVENT = 'mentio-os:mention-status';

/** `null` puts the badges back to what the server last said (a failed save). */
export function announceStatus(ids: string[], status: string | null) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { ids, status } }));
}

export function MentionStatus({ id, status }: { id: string; status: string }) {
  const [shown, setShown] = useState(status);
  useEffect(() => setShown(status), [status]);
  useEffect(() => {
    const on = (e: Event) => {
      const { ids, status: next } = (e as CustomEvent<{ ids: string[]; status: string | null }>).detail;
      if (ids.includes(id)) setShown(next ?? status);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [id, status]);
  return (
    <Badge variant="outline" className="capitalize">
      {({ new: 'Nuevo', open: 'Abierto', done: 'Resuelto', snoozed: 'Pospuesto', ignored: 'Ignorado' } as Record<string, string>)[shown] ?? shown}
    </Badge>
  );
}
