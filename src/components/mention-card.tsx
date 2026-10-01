import type { Mention } from '@mentio-dev/sdk';
import Link from 'next/link';
import { setMentionStatus } from '@/app/(dashboard)/mentions/actions';
import { Badge, sentimentTone } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { compact, platformName, tagName, timeAgo } from '@/lib/format';

export function Avatar({ name, url, size = 'size-7' }: { name: string | null | undefined; url: string | null | undefined; size?: string }) {
  return url ? (
    <img src={url} alt="" className={`${size} shrink-0 rounded-full bg-muted object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground`}>
      {(name ?? '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

/** A keyword as people read it: the term, plus its group outside the default one. */
export const keywordLabel = (keyword: Mention['keyword']) => (keyword.group.isDefault ? keyword.term : `${keyword.term} (${keyword.group.name})`);

/** One mention in a list: who said what where, the verdict, and quick triage. */
export function MentionCard({ mention, actions = true }: { mention: Mention; actions?: boolean }) {
  const { post, author, classification: verdict } = mention;
  const views = post.engagement?.views;
  const href = `/mentions/${encodeURIComponent(mention.id)}`;
  const title = post.text || mention.review?.title || '(no text)';
  return (
    <article className="rounded-lg border border-line bg-card p-4 transition hover:border-border">
      <Link href={href} className="block">
        <header className="flex items-center gap-2 text-sm">
          <Avatar name={author?.name} url={author?.avatarUrl} />
          <span className="min-w-0 truncate font-medium">{author?.name ?? author?.handle ?? 'Unknown'}</span>
          {author?.followers ? <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{compact(author.followers)} followers</span> : null}
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {platformName(post.platform)} · {timeAgo(post.publishedAt)}
          </span>
        </header>

        {mention.review ? (
          <p className="mt-3 text-sm text-amber-500" aria-label={`${mention.review.rating} of ${mention.review.ratingMax} stars`}>
            {'★'.repeat(Math.max(0, Math.min(mention.review.rating, mention.review.ratingMax)))}
            <span className="text-zinc-300">{'★'.repeat(Math.max(0, mention.review.ratingMax - mention.review.rating))}</span>
          </p>
        ) : null}
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-foreground">{title}</p>
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        {verdict?.relevance !== undefined && verdict?.relevance !== null ? (
          <Badge tone={mention.relevant ? 'solid' : 'neutral'} className="font-mono">{verdict.relevance}</Badge>
        ) : null}
        {verdict?.sentiment ? <Badge tone={sentimentTone(verdict.sentiment)}>{verdict.sentiment}</Badge> : null}
        {(verdict?.intents ?? []).map((intent, intentIndex) => (
          <Badge key={`${intent}-${intentIndex}`} tone="accent">{tagName(intent)}</Badge>
        ))}
        {verdict?.uncertain ? <Badge tone="warn">uncertain</Badge> : null}
        <Badge tone="outline">{keywordLabel(mention.keyword)}</Badge>
        {views ? <span className="text-muted-foreground">{compact(views)} views</span> : null}
        {mention.status !== 'open' ? <Badge tone="neutral">{mention.status}</Badge> : null}
        {mention.triage.assignee ? <span className="text-muted-foreground">→ {mention.triage.assignee.name ?? mention.triage.assignee.email}</span> : null}
      </div>

      {verdict?.note ? <p className="mt-2 text-xs text-muted-foreground italic">{verdict.note}</p> : null}

      <footer className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
          Open on {platformName(post.platform)} ↗
        </a>
        <Link href={href} className="text-muted-foreground hover:text-foreground">Details</Link>
        {actions ? (
          <ActionForm action={setMentionStatus} className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            <input type="hidden" name="id" value={mention.id} />
            {mention.status !== 'done' ? <SubmitButton variant="secondary" size="sm" name="status" value="done">Done</SubmitButton> : null}
            {mention.status !== 'ignored' ? <SubmitButton variant="secondary" size="sm" name="status" value="ignored">Ignore</SubmitButton> : null}
            {mention.status !== 'open' ? <SubmitButton variant="secondary" size="sm" name="status" value="open">Reopen</SubmitButton> : null}
          </ActionForm>
        ) : null}
      </footer>
    </article>
  );
}
