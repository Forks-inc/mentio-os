export default function LoadingAlertTemplates() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2"><div className="h-6 w-52 rounded bg-muted" /><div className="h-4 w-80 max-w-full rounded bg-muted" /></div>
      <div className="grid gap-4 @4xl:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10"><div className="h-10 w-10 rounded-xl bg-muted" /><div className="h-5 w-48 rounded bg-muted" /><div className="h-12 rounded bg-muted" /><div className="h-10 rounded bg-muted" /></div>)}
      </div>
    </div>
  );
}
