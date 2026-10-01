'use client';

/**
 * A page opened over the list it was clicked from, in a side drawer (the
 * Mentio dashboard's way to open anything). The routes under app/@drawer
 * intercept a soft navigation to a detail or "new" page and render that same
 * page in here, where it reads as one narrow column: the content is a
 * container (pages lay out by container queries) and cards turn into
 * sections (globals.css, [data-drawer]). Closing goes back to the list; a
 * pasted or reloaded link still opens the full page.
 */
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { DrawerSavedContext, useDiscardGuard } from '@/components/ui/client';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/** Dub's sheet: a panel floating 8px in from the edges, rounded, on a light overlay. */
export const FLOATING_SHEET = 'inset-y-2 right-2 w-[calc(100%-1rem)] gap-0 rounded-xl p-0 shadow-xl';

export function RouteDrawer({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const guard = useDiscardGuard(() => {
    setOpen(false);
    router.back();
  });
  return (
    <>
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : guard.request())}>
      <SheetContent data-drawer="" {...guard.bind} className={cn(FLOATING_SHEET, wide ? 'sm:max-w-3xl' : 'sm:max-w-[600px]', '[&_[data-slot=back-link]]:hidden')}>
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <DrawerSavedContext.Provider value={guard.reset}>
          <div className="@container px-6 pt-6 pb-10">{children}</div>
        </DrawerSavedContext.Provider>
      </SheetContent>
    </Sheet>
    {guard.dialog}
    </>
  );
}
