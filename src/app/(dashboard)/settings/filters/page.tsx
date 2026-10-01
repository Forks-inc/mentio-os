import { Card, Field, PageHeader, Textarea } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { date } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { updateFiltersAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Noise filters' };

/** Workspace-wide noise rules, on top of each keyword's own. */
export default async function Filters() {
  const filters = unwrap(await mentio().getFilters());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Noise filters"
        description="Rules for every keyword in the workspace, on top of each keyword's own. A dropped post is never stored and never billed."
      />

      <ActionForm action={updateFiltersAction} className="space-y-6">
        <Card title="Everywhere" description="One entry per line, or separated by commas.">
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Excluded terms" hint="A post containing any of these is dropped, whatever keyword matched it. A * at the start or end is a wildcard. Up to 200.">
              <Textarea name="excludedTerms" rows={6} defaultValue={filters.excludedTerms.join('\n')} placeholder={'hiring\njob\ncareers'} />
            </Field>
            <Field label="Excluded authors" hint="Your own accounts, employees, known spammers: profile or post links, @handles, u/names, Bluesky DIDs or display names. Up to 200.">
              <Textarea name="excludedAuthors" rows={6} defaultValue={filters.excludedAuthors.join('\n')} placeholder={'@acme\nhttps://github.com/acme-bot'} />
            </Field>
          </div>
        </Card>

        <Card title="GitHub">
          <Field label="Excluded repositories" hint="Issues, pull requests and comments in these repositories are dropped. owner/name or a github.com link.">
            <Textarea name="excludedRepos" rows={4} defaultValue={filters.excludedRepos.join('\n')} placeholder="acme/website" />
          </Field>
        </Card>

        <Card title="Reddit">
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Only these subreddits" hint="When set, only posts from these pass and the excluded list below is ignored. r/name or name.">
              <Textarea name="subredditsOnly" rows={4} defaultValue={filters.subreddits.only.join('\n')} placeholder="r/devops" />
            </Field>
            <Field label="Excluded subreddits" hint="Posts from these are dropped. r/name or name.">
              <Textarea name="subredditsExcluded" rows={4} defaultValue={filters.subreddits.excluded.join('\n')} placeholder="r/memes" />
            </Field>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <SubmitButton>Save filters</SubmitButton>
          {filters.updatedAt ? <span className="text-xs text-muted-foreground">Last changed {date(filters.updatedAt)}</span> : null}
        </div>
      </ActionForm>
    </div>
  );
}
