/**
 * One form for creating and editing a keyword. Every field of the create and
 * update calls is here; the term is fixed once the keyword exists.
 */
import type { Group, Keyword } from '@mentio-dev/sdk';
import { Card, Checkbox, Field, Input, PlatformPicker, Segmented, Select, SwitchRow, Textarea, TokenInput } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { date, platformName, REVIEW_PLATFORMS, SEARCH_PLATFORMS } from '@/lib/format';
import { createKeywordAction, updateKeywordAction } from './actions';
import { KIND_LABELS, KINDS, sourceKey, takesCountries, takesLanguage } from './shared';

const KIND_HINTS: Record<string, string> = { brand: 'Your own names.', competitor: 'A rival: counted in share of voice.', topic: 'The space you work in.' };

export function KeywordForm({ keyword, groups }: { keyword?: Keyword; groups: Group[] }) {
  const editing = Boolean(keyword);
  const defaultGroup = groups.find((g) => g.isDefault)?.id ?? '';
  const cap = keyword?.cap ? (keyword.cap.welcome ? keyword.cap.own : keyword.cap.mentions) : null;
  const matching = keyword?.matching;
  // The keyword's own group always appears, so saving never moves it by accident.
  const groupOptions = groups.map((g) => [g.id, g.isDefault ? `${g.name} (default)` : g.name] as const);
  if (keyword && !groups.some((g) => g.id === keyword.group.id)) groupOptions.unshift([keyword.group.id, keyword.group.name]);

  return (
    <ActionForm action={editing ? updateKeywordAction : createKeywordAction} className="space-y-6">
      {keyword ? <input type="hidden" name="id" value={keyword.id} /> : null}

      <Card title="Keyword">
        <div className="grid gap-4 @lg:grid-cols-2">
          {keyword ? (
            <Field label="Term" hint="A term cannot be changed.">
              <Input value={keyword.term} readOnly disabled />
            </Field>
          ) : (
            <Field label="Term" hint="Matched as a phrase.">
              <Input name="term" required minLength={2} maxLength={80} placeholder="Your brand, a competitor, a topic" />
            </Field>
          )}
          <Field group label="Kind">
            <Segmented
              name="kind"
              defaultValue={keyword?.kind ?? 'brand'}
              options={KINDS.map((k) => ({ value: k, label: KIND_LABELS[k], description: KIND_HINTS[k] }))}
            />
          </Field>
          <Field label="Group" hint="A term can be tracked once per group.">
            <Select name="groupId" defaultValue={keyword?.group.id ?? defaultGroup} options={groupOptions} />
          </Field>
          <Field label="Monthly mention cap" hint="Per calendar month. Empty for none.">
            <Input name="cap" type="number" min={1} max={1000000} defaultValue={cap ?? ''} placeholder="No cap" />
          </Field>
        </div>
        {keyword?.cap?.welcome ? (
          <p className="mt-3 text-xs text-amber-700">
            Your workspace is on its welcome credit, so this keyword stops at {keyword.cap.mentions} mentions a month until the first top-up. The cap above is the one it gets after that.
          </p>
        ) : null}
        <Field className="mt-4" label="Context for the classifier" hint="What the term means here, and what to ignore.">
          <Textarea name="context" rows={2} maxLength={300} defaultValue={keyword?.context ?? ''} placeholder="Arc is our browser; ignore the geometry word." />
        </Field>
      </Card>

      <Card title="Platforms">
        <PlatformPicker name="platforms" options={SEARCH_PLATFORMS} defaultValue={keyword?.platforms ?? null} labels={Object.fromEntries(SEARCH_PLATFORMS.map((p) => [p, platformName(p)]))} />
        <SwitchRow name="reviewsOnly" defaultChecked={keyword?.platforms?.length === 0} label="Reviews only" hint="Search the term nowhere; only collect the review pages below." />
      </Card>

      <Card title="Matching rules" description="Checked before a mention is stored. A dropped post is never billed.">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="Required terms" hint="The post must also contain these.">
            <TokenInput name="requiredTerms" defaultValue={matching?.requiredTerms} placeholder="api, sdk… press Enter" />
          </Field>
          <Field group label="Required mode">
            <Segmented
              name="requiredMode"
              defaultValue={matching?.requiredMode ?? 'any'}
              options={[
                { value: 'any', label: 'Any of them', description: 'One required term is enough.' },
                { value: 'all', label: 'All of them', description: 'Every required term must appear.' },
              ]}
            />
          </Field>
          <Field label="Excluded terms" hint="Dropped when present. * is a wildcard: *bot.">
            <TokenInput name="excludedTerms" defaultValue={matching?.excludedTerms} placeholder="hiring, job… press Enter" />
          </Field>
          <Field label="Excluded authors" hint="Links, @handles or names.">
            <TokenInput name="excludedAuthors" defaultValue={matching?.excludedAuthors} splitOnComma={false} placeholder="@spammer… press Enter" />
          </Field>
        </div>
        <SwitchRow name="caseSensitive" defaultChecked={matching?.caseSensitive ?? false} label="Case sensitive" hint="The term must appear as typed: RAG, never rag." />
      </Card>

      <Card
        title="Review pages"
        description="Every review of a connected page becomes a mention. A new page brings its last 30 days free."
      >
        {keyword && keyword.reviewSources.length > 0 ? (
          <ul className="mb-4 divide-y divide-line rounded-md border border-line">
            {keyword.reviewSources.map((src) => {
              const key = sourceKey(src);
              return (
                <li key={key} className="space-y-2 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-medium">{platformName(src.platform)}</span>{' '}
                      <a href={src.url} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{src.id}</a>
                      <span className="ml-2 text-xs text-muted-foreground">since {date(src.connectedAt)}</span>
                    </div>
                    <div className="text-destructive">
                      <Checkbox name="removeSource" value={key} label="Remove" />
                    </div>
                  </div>
                  {takesCountries(src.platform) || takesLanguage(src.platform) ? (
                    <div className="grid gap-2 @lg:grid-cols-2">
                      {takesCountries(src.platform) ? (
                        <Field label="Countries" hint="Two-letter codes, comma separated.">
                          <Input name={`${key}.countries`} defaultValue={src.countries.join(', ')} />
                        </Field>
                      ) : null}
                      {takesLanguage(src.platform) ? (
                        <Field label="Language">
                          <Input name={`${key}.language`} defaultValue={src.language ?? ''} placeholder="en" />
                        </Field>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
        <p className="mb-3 text-xs font-medium text-foreground/80">{keyword?.reviewSources.length ? 'Connect another page' : 'Connect a page'} (optional)</p>
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field className="@lg:col-span-2" label="Link" hint="An App Store or Google Play app, a Trustpilot page or a Google Maps place (a maps.app.goo.gl link works).">
            <Input name="rsUrl" type="text" inputMode="url" placeholder="https://apps.apple.com/us/app/notion/id1232780281" />
          </Field>
          <Field label="Or the platform" hint="Needed when you give an id instead of a link.">
            <Select name="rsPlatform" placeholder="From the link" options={REVIEW_PLATFORMS.map((p) => [p, platformName(p)] as const)} />
          </Field>
          <Field label="And the id" hint="App Store: the digits after id. Google Play: the package name. Trustpilot: the domain. Google Maps: the Place ID.">
            <Input name="rsId" placeholder="notion.so" />
          </Field>
          <Field label="Countries" hint="App Store and Google Play only, up to 20, comma separated. Default: the link's, else us.">
            <Input name="rsCountries" placeholder="us, gb, de" />
          </Field>
          <Field label="Language" hint="Google Play only. Default: the link's, else en.">
            <Input name="rsLanguage" placeholder="en" />
          </Field>
        </div>
      </Card>

      <div data-slot="form-actions" className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{editing ? null : 'A new keyword reads back the last 30 days at once.'}</span>
        <SubmitButton>{editing ? 'Save changes' : 'Create keyword'}</SubmitButton>
      </div>
    </ActionForm>
  );
}
