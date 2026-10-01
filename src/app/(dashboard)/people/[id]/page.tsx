import Link from 'next/link';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { Badge, Card, DateTimePicker, Field, Input, PageHeader, Select, Stat, Textarea, buttonClass, sentimentTone, SwitchRow } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { compact, date, platformName, tagName, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { one, type SearchParams } from '@/lib/params';
import { Avatar, SentimentBar, displayName } from '../bits';
import { STAGE_OPTIONS, stageName } from '../filters';
import { deleteActivity, logActivity, mergePeople, splitAccount, updatePerson } from './actions';
import { ACTIVITY_CHANNELS, CHANNEL_NAMES } from './channels';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Person' };

const excerpt = (text: string, max = 220) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

/** One person: who they are, what they said, and where you stand with them. */
export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const { id } = await params;
  const search = await searchParams;
  const mergeQ = one(search, 'merge');
  const api = mentio();
  const [person, activities, mentions, members, candidates] = await Promise.all([
    api.getPerson({ path: { id } }).then(unwrap),
    api.listPersonActivities({ path: { id } }).then(unwrap),
    api.searchMentions({ query: { personId: id, limit: 20 } }).then(unwrap),
    api.listMembers().then(unwrap),
    mergeQ ? api.listPeople({ query: { q: mergeQ, limit: 10 } }).then(unwrap) : Promise.resolve(null),
  ]);
  const { stats, reach, profile, annotations, outreach } = person;
  const others = candidates?.data.filter((p) => p.id !== person.id) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/people', label: 'People' }}
        title={
          <span className="flex items-center gap-3">
            <Avatar person={person} size="size-10" />
            <span className="min-w-0">
              <span className="block truncate">{displayName(person)}</span>
              <span className="block text-sm font-normal text-muted-foreground">
                {[person.handle, platformName(person.platform)].filter(Boolean).join(' · ')}
              </span>
            </span>
          </span>
        }
        actions={
          <>
            {annotations.muted ? <Badge tone="warn">Muted</Badge> : null}
            <Badge tone="accent">{stageName(outreach.stage)}</Badge>
            {person.url ? <a href={person.url} target="_blank" rel="noreferrer" className={buttonClass('secondary')}>Profile ↗</a> : null}
          </>
        }
      />

      <div className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-5">
        <Stat label="Followers" value={reach.followers === null ? '?' : compact(reach.followers)} hint={reach.posts !== null ? `${compact(reach.posts)} posts` : undefined} />
        <Stat label="Mentions" value={stats.mentions} hint={`${stats.relevant} relevant`} />
        <Stat label="First seen" value={<span className="text-base">{timeAgo(stats.firstSeenAt)}</span>} hint={date(stats.firstSeenAt)} />
        <Stat label="Last seen" value={<span className="text-base">{timeAgo(stats.lastSeenAt)}</span>} hint={date(stats.lastSeenAt)} />
        <Stat
          label="Last contacted"
          value={<span className="text-base">{outreach.lastContactedAt ? timeAgo(outreach.lastContactedAt) : 'Never'}</span>}
          hint={outreach.owner ? `Owner: ${outreach.owner.name ?? outreach.owner.email}` : 'No owner'}
        />
      </div>

      <div className="grid gap-6 @4xl:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-6">
          <Card title="Profile" description={profile ? `Read ${timeAgo(profile.fetchedAt)}` : 'Not looked up yet.'}>
            {profile ? (
              <dl className="grid gap-x-6 gap-y-3 text-sm @lg:grid-cols-2">
                {profile.bio ? <div className="@lg:col-span-2"><dt className="text-xs text-muted-foreground">Bio</dt><dd className="whitespace-pre-line">{profile.bio}</dd></div> : null}
                <Fact label="Company" value={profile.company} />
                <Fact label="Location" value={profile.location} />
                <Fact label="Website" value={profile.website} href={profile.website ? (profile.website.startsWith('http') ? profile.website : `https://${profile.website}`) : null} />
                <Fact label="Email" value={profile.email} href={profile.email ? `mailto:${profile.email}` : null} />
                {profile.links.length ? (
                  <div className="@lg:col-span-2">
                    <dt className="text-xs text-muted-foreground">Linked accounts</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {profile.links.map((l) => (
                        <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{tagName(l.provider)}</a>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Profile facts appear once the person is looked up on their platform.</p>
            )}
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-1.5 text-xs text-muted-foreground">Sentiment of their mentions</p>
              <SentimentBar sentiment={stats.sentiment} className="h-2 w-full" />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {stats.sentiment.positive} positive · {stats.sentiment.neutral} neutral · {stats.sentiment.negative} negative
              </p>
            </div>
          </Card>

          <Card title="Accounts" description="Every account treated as this person. The first is the main one.">
            <ul className="divide-y divide-line text-sm">
              {person.accounts.map((account, i) => (
                <li key={account.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="font-medium">{account.name ?? account.handle ?? account.id}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{[account.handle, platformName(account.platform)].filter(Boolean).join(' · ')}</span>
                    {i === 0 ? <Badge className="ml-2">main</Badge> : null}
                  </span>
                  <span className="flex items-center gap-2">
                    {account.url ? <a href={account.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open ↗</a> : null}
                    {i > 0 ? (
                      <ActionForm action={splitAccount}>
                        <input type="hidden" name="id" value={person.id} />
                        <input type="hidden" name="accountId" value={account.id} />
                        <SubmitButton variant="secondary" size="sm" confirm="Split this account back into its own person?">Split out</SubmitButton>
                      </ActionForm>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Recent mentions" actions={<Link href={`/mentions?personId=${person.id}`} className="text-xs text-primary hover:underline">All mentions</Link>}>
            {mentions.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mentions to show.</p>
            ) : (
              <ul className="divide-y divide-line">
                {mentions.data.map((m) => (
                  <li key={m.id} className="py-2.5 first:pt-0 last:pb-0">
                    <Link href={`/mentions/${m.id}`} className="block rounded hover:bg-muted/50">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{platformName(m.post.platform)}</span>
                        <span>·</span>
                        <span>{m.keyword.term}</span>
                        <span>·</span>
                        <span>{timeAgo(m.post.publishedAt)}</span>
                        {m.classification ? <Badge tone={sentimentTone(m.classification.sentiment)}>{m.classification.sentiment}</Badge> : null}
                        {m.relevant ? <Badge tone="accent">relevant</Badge> : null}
                        {m.review ? <Badge>{'★'.repeat(m.review.rating)}</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-foreground">{excerpt(m.post.text) || <span className="text-muted-foreground">No text</span>}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Your notes">
            <ActionForm action={updatePerson} className="space-y-3">
              <input type="hidden" name="id" value={person.id} />
              <Field label="Stage">
                <Select name="stage" defaultValue={outreach.stage} options={STAGE_OPTIONS} />
              </Field>
              <Field label="Owner">
                <Select
                  name="ownerId"
                  defaultValue={outreach.owner?.id ?? ''}
                  placeholder="Nobody"
                  options={members.data.map((m) => [m.userId, m.name ?? m.email] as const)}
                />
              </Field>
              <Field label="Tags" hint="Comma separated, up to 20.">
                <Input name="tags" defaultValue={annotations.tags.join(', ')} />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" maxLength={2000} defaultValue={annotations.notes} />
              </Field>
              <SwitchRow name="muted" defaultChecked={annotations.muted} label="Mute" hint="Keep their posts out of the feed and every channel." />
              <SubmitButton>Save</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Outreach log" description="Logging the first contact claims an unowned person for you and moves them to contacted.">
            <ActionForm action={logActivity} className="space-y-3" resetOnSuccess>
              <input type="hidden" name="id" value={person.id} />
              <div className="grid gap-3 @lg:grid-cols-2">
                <Field label="Channel">
                  <Select name="channel" defaultValue="email" options={ACTIVITY_CHANNELS.map((c) => [c, CHANNEL_NAMES[c]] as const)} />
                </Field>
                <Field label="When (UTC)" hint="Empty means now.">
                  <DateTimePicker name="occurredAt" placeholder="Now" />
                </Field>
              </div>
              <Field label="Note">
                <Textarea name="note" rows={2} maxLength={2000} placeholder="What was sent or said" />
              </Field>
              <SubmitButton>Log contact</SubmitButton>
            </ActionForm>
            {activities.data.length ? (
              <ul className="mt-4 divide-y divide-line border-t border-line text-sm">
                {activities.data.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{CHANNEL_NAMES[a.channel]}</span> · {date(a.occurredAt)}
                        {a.member ? ` · ${a.member.name ?? a.member.email}` : ''}
                      </p>
                      {a.note ? <p className="mt-0.5 whitespace-pre-line">{a.note}</p> : null}
                    </div>
                    <ActionForm action={deleteActivity}>
                      <input type="hidden" name="id" value={person.id} />
                      <input type="hidden" name="activityId" value={a.id} />
                      <SubmitButton variant="ghost" size="sm" confirm="Delete this entry?">Delete</SubmitButton>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 border-t border-line pt-3 text-sm text-muted-foreground">No contact logged yet.</p>
            )}
          </Card>

          <Card title="Merge" description="Same human on another platform? Merge the accounts so their mentions, tags, notes and log add up. Only in your workspace, and you can split them again.">
            <form method="GET" className="flex gap-2">
              <Input name="merge" defaultValue={mergeQ} placeholder="Search people by name or handle" />
              <Button type="submit" variant="outline">Search</Button>
            </form>
            {candidates ? (
              others.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nobody else matches.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line text-sm">
                  {others.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link href={`/people/${p.id}`} className="flex min-w-0 items-center gap-2 hover:underline">
                        <Avatar person={p} size="size-6" />
                        <span className="truncate">{displayName(p)}</span>
                        <span className="text-xs text-muted-foreground">{platformName(p.platform)} · {p.stats.mentions} mentions</span>
                      </Link>
                      <span className="flex gap-1.5">
                        <ActionForm action={mergePeople}>
                          <input type="hidden" name="from" value={p.id} />
                          <input type="hidden" name="into" value={person.id} />
                          <SubmitButton size="sm" confirm={`Merge ${displayName(p)} into ${displayName(person)}?`}>Merge here</SubmitButton>
                        </ActionForm>
                        <ActionForm action={mergePeople}>
                          <input type="hidden" name="from" value={person.id} />
                          <input type="hidden" name="into" value={p.id} />
                          <SubmitButton variant="secondary" size="sm" confirm={`Merge ${displayName(person)} into ${displayName(p)}?`}>Merge into them</SubmitButton>
                        </ActionForm>
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, href }: { label: string; value: string | null; href?: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate">{href ? <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">{value}</a> : value}</dd>
    </div>
  );
}
