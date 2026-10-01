import type { Mention } from '@mentio-dev/sdk';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, keywordLabel } from '@/components/mention-card';
import { ExternalLink } from 'lucide-react';
import { PlatformIcon } from '@/components/platform-icon';
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, Card, DateTimePicker, Field, Input, LinkButton, PageHeader, Select, Textarea, buttonClass, sentimentTone } from '@/components/ui';
import { ActionForm, CopyButton, SubmitButton } from '@/components/ui/client';
import { compact, platformName, tagName, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { muteAuthorInAlert, saveTriage, setMentionStatus, setVerdict, snoozeMention } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mention' };

/** A date, or nothing when the value is missing or not a date. */
function when(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(d) + ' UTC';
}

const ENGAGEMENT = [
  ['likes', 'Likes'],
  ['reposts', 'Reposts'],
  ['replies', 'Replies'],
  ['quotes', 'Quotes'],
  ['views', 'Views'],
  ['bookmarks', 'Bookmarks'],
] as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-foreground">{children}</dd>
    </div>
  );
}

/** The entry an alert's mute list takes: the profile link when there is one, else the handle or name. */
const muteEntry = (author: Mention['author']) => author?.url || author?.handle || author?.name || '';

export default async function MentionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = mentio();
  const [result, members, alerts] = await Promise.all([
    api.getMention({ path: { id } }),
    // The two pickers are secondary: a failure empties them instead of failing the page.
    api.listMembers().then(unwrap).then((r) => r.data).catch(() => null),
    api.listAlerts().then(unwrap).then((r) => r.data).catch(() => null),
  ]);
  if (result.response?.status === 404) notFound();
  const mention = unwrap(result);
  const { post, author, review, classification: verdict, triage } = mention;
  const snoozedUntil = triage.snoozedUntil ? new Date(triage.snoozedUntil) : null;
  const snoozed = snoozedUntil !== null && !Number.isNaN(snoozedUntil.getTime()) && snoozedUntil.getTime() > Date.now();
  const engagement = post.engagement ? ENGAGEMENT.filter(([key]) => post.engagement?.[key] !== null && post.engagement?.[key] !== undefined) : [];
  const entry = muteEntry(author);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/mentions', label: 'Mentions' }}
        title={
          <span className="flex items-center gap-3">
            <UiAvatar className="size-9">
              {author?.avatarUrl ? <AvatarImage src={author.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-sm font-semibold">{(author?.name ?? author?.handle ?? '?').replace(/^@/, '').slice(0, 1).toUpperCase()}</AvatarFallback>
            </UiAvatar>
            <span className="min-w-0 truncate">{author?.name ?? author?.handle ?? 'Mention'}</span>
          </span>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <PlatformIcon platform={post.platform} />
            {platformName(post.platform)} · {when(post.publishedAt) ?? 'unknown time'} ({timeAgo(post.publishedAt)})
          </span>
        }
        actions={
          <>
            <a href={post.url} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary')}>
              <ExternalLink /> Open on {platformName(post.platform)}
            </a>
            <CopyButton text={post.url} label="Copy link" />
          </>
        }
      />

      <div className="grid gap-6 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {post.replyTo ? (
            <div className="rounded-lg border border-line bg-muted/50 p-4 text-sm">
              <p className="text-xs text-muted-foreground">
                In reply to {post.replyTo.author ?? 'a post'}
                {post.replyTo.url ? (
                  <>
                    {' · '}
                    <a href={post.replyTo.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">open ↗</a>
                  </>
                ) : null}
              </p>
              {post.replyTo.text ? <p className="mt-1 line-clamp-6 whitespace-pre-line text-muted-foreground">{post.replyTo.text}</p> : null}
            </div>
          ) : null}

          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            {review ? (
              <div className="mb-3 space-y-1">
                <p className="text-lg text-amber-500" aria-label={`${review.rating} of ${review.ratingMax} stars`}>
                  {'★'.repeat(Math.max(0, Math.min(review.rating, review.ratingMax)))}
                  <span className="text-zinc-300">{'★'.repeat(Math.max(0, review.ratingMax - review.rating))}</span>
                  <span className="ml-2 align-middle text-xs text-muted-foreground">{review.rating} of {review.ratingMax}</span>
                </p>
                {review.title ? <p className="font-semibold">{review.title}</p> : null}
              </div>
            ) : null}
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-foreground">{post.text || '(no text)'}</p>

            {engagement.length ? (
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-3 text-sm">
                {engagement.map(([key, label]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">{compact(post.engagement?.[key])}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {post.links.length ? (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs text-muted-foreground">Links in this post</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {post.links.map((link, linkIndex) => (
                    <li key={`${link}-${linkIndex}`} className="truncate">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {review ? (
            <Card title="Review">
              <dl className="divide-y divide-line">
                <Row label="Store">
                  <a href={review.app.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {platformName(review.app.platform)}: {review.app.id} ↗
                  </a>
                </Row>
                {review.country ? <Row label="Country">{review.country.toUpperCase()}</Row> : null}
                {review.version ? <Row label="Version">{review.version}</Row> : null}
                {review.verified !== null ? <Row label="Verified">{review.verified ? 'Yes' : 'No'}</Row> : null}
              </dl>
              {review.response ? (
                <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Your reply{when(review.responseAt) ? `, ${when(review.responseAt)}` : ''}</p>
                  <p className="mt-1 whitespace-pre-line text-foreground/80">{review.response}</p>
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card title="Verdict" description={verdict?.feedback ? 'You corrected the classifier on this one.' : 'What the classifier made of it.'}>
            {!verdict ? (
              <p className="text-sm text-muted-foreground">Not classified yet.</p>
            ) : verdict.failed ? (
              <p className="text-sm text-muted-foreground">Classification failed for this mention. It is not billed.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge tone={mention.relevant ? 'solid' : 'neutral'} className="font-mono">Relevance {verdict.relevance ?? 'none'}</Badge>
                  <Badge tone={sentimentTone(verdict.sentiment)}>{verdict.sentiment}</Badge>
                  {verdict.intents.map((intent, intentIndex) => <Badge key={`${intent}-${intentIndex}`} tone="accent">{tagName(intent)}</Badge>)}
                  {verdict.uncertain ? <Badge tone="warn">uncertain</Badge> : null}
                  {verdict.automated ? <Badge tone="outline">automated</Badge> : null}
                </div>
                {verdict.note ? <p className="text-sm text-foreground/80">{verdict.note}</p> : null}
                <dl className="divide-y divide-line">
                  <Row label="Relevant">{mention.relevant ? 'Yes' : 'No'}</Row>
                  {verdict.confidence !== null ? <Row label="Confidence">{Math.round(verdict.confidence * 100)}%</Row> : null}
                  {verdict.language ? <Row label="Language">{verdict.language}</Row> : null}
                  <Row label="Priority">{mention.priority}</Row>
                  {verdict.feedback ? (
                    <Row label="Before your correction">
                      relevance {verdict.feedback.original.relevance ?? 'none'}, {verdict.feedback.original.sentiment}
                    </Row>
                  ) : null}
                </dl>

                <div className="space-y-3 border-t border-line pt-3">
                  <p className="text-xs text-muted-foreground">Correct the verdict for this mention. It never changes the bill.</p>
                  <ActionForm action={setVerdict} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={mention.id} />
                    <SubmitButton variant="secondary" size="sm" name="relevant" value="true">Relevant</SubmitButton>
                    <SubmitButton variant="secondary" size="sm" name="relevant" value="false">Not relevant</SubmitButton>
                    {verdict.feedback?.relevant !== null && verdict.feedback?.relevant !== undefined ? (
                      <SubmitButton variant="ghost" size="sm" name="relevant" value="reset">Undo relevance</SubmitButton>
                    ) : null}
                  </ActionForm>
                  <ActionForm action={setVerdict} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={mention.id} />
                    <span className="text-sm text-muted-foreground">Sentiment is</span>
                    {(['positive', 'neutral', 'negative'] as const).map((s, sIndex) => (
                      <SubmitButton key={`${s}-${sIndex}`} variant={verdict.sentiment === s ? 'primary' : 'secondary'} size="sm" name="sentiment" value={s}>{tagName(s)}</SubmitButton>
                    ))}
                    {verdict.feedback?.sentiment ? <SubmitButton variant="ghost" size="sm" name="sentiment" value="reset">Undo sentiment</SubmitButton> : null}
                  </ActionForm>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Author">
            {author ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={author.name} url={author.avatarUrl} size="size-10" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{author.name ?? 'Unknown'}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[author.handle, author.followers !== null ? `${compact(author.followers)} followers` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {author.tags.length ? (
                  <div className="flex flex-wrap gap-1">{author.tags.map((t, tIndex) => <Badge key={`${t}-${tIndex}`} tone="outline">{t}</Badge>)}</div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {author.id ? <LinkButton href={`/people/${encodeURIComponent(author.id)}`} size="sm">View person</LinkButton> : null}
                  {author.url ? (
                    <a href={author.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted">Profile ↗</a>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">The platform does not name an author.</p>
            )}
          </Card>

          <Card title="Keyword">
            <dl className="divide-y divide-line">
              <Row label="Keyword">
                <Link href={`/mentions?keywordIds=${encodeURIComponent(mention.keyword.id)}`} className="text-primary hover:underline">{keywordLabel(mention.keyword)}</Link>
              </Row>
              <Row label="Group">{mention.keyword.group.name}</Row>
              <Row label="Matched">{when(mention.createdAt) ?? ''}</Row>
              <Row label="Alerted">{mention.delivered ? 'Yes' : 'No'}</Row>
            </dl>
          </Card>

          <Card title="Triage">
            <div className="space-y-5">
              <ActionForm action={setMentionStatus} className="space-y-2">
                <input type="hidden" name="id" value={mention.id} />
                <p className="text-sm">
                  Status: <Badge tone={mention.status === 'open' ? 'accent' : 'neutral'}>{mention.status}</Badge>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {mention.status !== 'done' ? <SubmitButton variant="secondary" size="sm" name="status" value="done">Mark done</SubmitButton> : null}
                  {mention.status !== 'ignored' ? <SubmitButton variant="secondary" size="sm" name="status" value="ignored">Ignore</SubmitButton> : null}
                  {mention.status !== 'open' ? <SubmitButton variant="secondary" size="sm" name="status" value="open">Reopen</SubmitButton> : null}
                </div>
              </ActionForm>

              <ActionForm action={saveTriage} className="space-y-3 border-t border-line pt-4">
                <input type="hidden" name="id" value={mention.id} />
                <Field label="Assignee">
                  {members ? (
                    <Select
                      name="assigneeId"
                      defaultValue={triage.assignee?.id ?? ''}
                      placeholder="Nobody"
                      options={[
                        ...members.map((m) => [m.userId, m.name ?? m.email] as const),
                        // Someone assigned who has since left still shows.
                        ...(triage.assignee && !members.some((m) => m.userId === triage.assignee?.id)
                          ? [[triage.assignee.id, triage.assignee.name ?? triage.assignee.email ?? triage.assignee.id] as const]
                          : []),
                      ]}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">Could not load the team.</p>
                  )}
                </Field>
                <Field label="Internal note" hint="Only your team sees it.">
                  <Textarea name="note" rows={3} maxLength={2000} defaultValue={triage.note ?? ''} />
                </Field>
                <SubmitButton size="sm">Save</SubmitButton>
              </ActionForm>

              <ActionForm action={snoozeMention} className="space-y-2 border-t border-line pt-4">
                <input type="hidden" name="id" value={mention.id} />
                <p className="text-sm font-medium text-foreground">Snooze</p>
                <p className="text-xs text-muted-foreground">
                  {snoozed ? `Out of the feed until ${when(triage.snoozedUntil)}.` : 'Hide it from the feed until later.'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <SubmitButton variant="secondary" size="sm" name="snooze" value="hour">1 hour</SubmitButton>
                  <SubmitButton variant="secondary" size="sm" name="snooze" value="day">1 day</SubmitButton>
                  <SubmitButton variant="secondary" size="sm" name="snooze" value="week">1 week</SubmitButton>
                  {snoozed ? <SubmitButton variant="ghost" size="sm" name="snooze" value="clear">Wake now</SubmitButton> : null}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Until (UTC)" className="min-w-0 flex-1">
                    <DateTimePicker name="until" />
                  </Field>
                  <SubmitButton variant="secondary" size="sm" name="snooze" value="custom">Snooze</SubmitButton>
                </div>
              </ActionForm>
            </div>
          </Card>

          {entry ? (
            <Card title="Mute this author" description="Stops an alert from sending their posts. The feed still shows them.">
              {alerts === null ? (
                <p className="text-sm text-muted-foreground">Could not load your alerts.</p>
              ) : alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No alerts yet. <Link href="/alerts" className="text-primary hover:underline">Create one</Link>.
                </p>
              ) : (
                <ActionForm action={muteAuthorInAlert} className="space-y-2">
                  <input type="hidden" name="author" value={entry} />
                  <p className="truncate text-xs text-muted-foreground" title={entry}>Mutes {entry}</p>
                  <Select name="alertId" required defaultValue="" placeholder="Pick an alert" options={alerts.map((a) => [a.id, a.name] as const)} />
                  <SubmitButton variant="secondary" size="sm">Mute in alert</SubmitButton>
                </ActionForm>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
