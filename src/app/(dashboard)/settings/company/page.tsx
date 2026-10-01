import Link from 'next/link';
import { Field, Input, PageHeader, Textarea } from '@/components/ui';
import { FormCard } from '@/components/ui/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mentio, unwrap } from '@/lib/mentio';
import { updateContextAction, updateProfileAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Company' };

/** The company profile: what the classifier scores every mention against, one small card per part. */
export default async function Company() {
  const company = unwrap(await mentio().getCompany());

  return (
    <div className="max-w-3xl">
      <PageHeader title="Company" description="What the classifier knows about you. The more precise, the less noise." />

      <div className="grid gap-4">
        <FormCard action={updateProfileAction} title="Brand" description="Who you are and where you post." hint="Your own posts are recognized by these accounts.">
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Name">
              <Input name="name" required maxLength={120} defaultValue={company.name} />
            </Field>
            <Field label="Website">
              <Input name="website" inputMode="url" maxLength={300} defaultValue={company.website ?? ''} placeholder="https://acme.com" />
            </Field>
            <Field label="X account">
              <Input name="x" maxLength={60} defaultValue={company.accounts.x ?? ''} placeholder="acme" />
            </Field>
            <Field label="LinkedIn page">
              <Input name="linkedin" maxLength={200} defaultValue={company.accounts.linkedin ?? ''} placeholder="acme-inc" />
            </Field>
          </div>
        </FormCard>

        <FormCard action={updateProfileAction} title="What you do" description="One paragraph. The biggest lever on relevance." hint="Applies to new mentions.">
          <Textarea name="description" rows={4} maxLength={1000} defaultValue={company.description} placeholder="Acme is an API that…" aria-label="What the company does" />
        </FormCard>

        <FormCard action={updateProfileAction} title="Relevance" description="What counts for you, and who you compete with." hint="One entry per line.">
          <Field label="Guidelines">
            <Textarea name="guidelines" rows={3} maxLength={2000} defaultValue={company.guidelines ?? ''} placeholder="Posts about our API count. Job listings never do." />
          </Field>
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Use cases">
              <Textarea name="useCases" rows={4} defaultValue={company.useCases.join('\n')} placeholder={'Brand monitoring\nLead finding'} />
            </Field>
            <Field label="Competitors">
              <Textarea name="competitors" rows={4} defaultValue={company.competitors.join('\n')} placeholder={'Rival One\nRival Two'} />
            </Field>
          </div>
        </FormCard>

        <Collapsible>
          <CollapsibleTrigger className="text-sm text-muted-foreground hover:text-foreground">Advanced: the text the classifier reads</CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <FormCard action={updateContextAction} title="Classifier text" description="Composed from the cards above. Edit it to override; the next save above composes it again." submit="Save override">
              <Textarea name="context" rows={10} maxLength={4000} defaultValue={company.context} className="font-mono text-xs" aria-label="Classifier text" />
            </FormCard>
          </CollapsibleContent>
        </Collapsible>

        <p className="text-xs text-muted-foreground">
          Keywords in a <Link href="/settings/groups" className="text-primary hover:underline">group</Link> with its own description are judged with that instead.
        </p>
      </div>
    </div>
  );
}
