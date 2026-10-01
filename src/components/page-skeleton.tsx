/**
 * What a page shows while its data loads (Midday's skeletons: the real
 * layout's shapes at fixed sizes, so nothing jumps when the data arrives).
 */
import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 grid gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
        <Skeleton className="h-9 rounded-none" />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t px-5 py-3.5">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A drawer's body while the record loads: the header, a block of text, a few detail rows. */
export function DrawerSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="grid gap-5">
      <div className="flex items-center gap-3 border-b pb-4">
        <Skeleton className="size-9 rounded-full" />
        <div className="grid gap-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-lg" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="grid grid-cols-[90px_1fr] items-center gap-3">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
