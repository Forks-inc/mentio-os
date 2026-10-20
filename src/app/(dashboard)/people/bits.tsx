/** Small pieces the people pages share. */
import type { Person } from '@mentio-dev/sdk';

/** Positive, neutral and negative as one stacked bar. */
export function SentimentBar({ sentiment, className = 'h-1.5 w-24' }: { sentiment: Person['stats']['sentiment']; className?: string }) {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  if (total === 0) return <span className="text-xs text-muted-foreground">Sin datos de sentimiento</span>;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div
      className={`flex overflow-hidden rounded-full bg-muted ${className}`}
      title={`${sentiment.positive} positivo, ${sentiment.neutral} neutral, ${sentiment.negative} negativo`}
    >
      <div className="bg-emerald-500" style={{ width: pct(sentiment.positive) }} />
      <div className="bg-zinc-300" style={{ width: pct(sentiment.neutral) }} />
      <div className="bg-red-500" style={{ width: pct(sentiment.negative) }} />
    </div>
  );
}

export function Avatar({ person, size = 'size-8' }: { person: Pick<Person, 'name' | 'handle' | 'avatarUrl'>; size?: string }) {
  const initial = (person.name ?? person.handle ?? '?').replace(/^@/, '').charAt(0).toUpperCase();
  return person.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.avatarUrl} alt="" className={`${size} shrink-0 rounded-full bg-muted object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-medium text-primary`}>{initial}</span>
  );
}

export const displayName = (person: Pick<Person, 'name' | 'handle' | 'id'>) => person.name ?? person.handle ?? person.id;
