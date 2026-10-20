export default function LoadingArranque() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      <div className="space-y-2"><div className="h-6 w-48 rounded bg-muted" /><div className="h-4 w-80 max-w-full rounded bg-muted" /></div>
      <div className="space-y-5 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="h-5 w-36 rounded bg-muted" /><div className="h-2 rounded-full bg-muted" />
        <div className="space-y-3 pt-4"><div className="h-4 w-40 rounded bg-muted" /><div className="h-10 rounded-md bg-muted" /><div className="h-4 w-32 rounded bg-muted" /><div className="h-10 rounded-md bg-muted" /></div>
      </div>
    </div>
  );
}
