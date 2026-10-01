import { redirect } from 'next/navigation';
import { brand } from '@/brand.config';
import { BrandMark } from '@/components/app-sidebar';
import { Field, Input } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { passwordProtected } from '@/lib/session';
import { one, type SearchParams } from '@/lib/params';
import { signIn } from './actions';

export const metadata = { title: 'Sign in' };
// Reads DASHBOARD_PASSWORD per request, never at build time.
export const dynamic = 'force-dynamic';

/** The password page, when DASHBOARD_PASSWORD is set. */
export default async function Login({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (!passwordProtected()) redirect('/');
  const next = one(await searchParams, 'next') ?? '/';
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <BrandMark className="mx-auto mb-2 size-9 text-base" />
          <CardTitle className="text-lg">Sign in to {brand.name}</CardTitle>
          <CardDescription>Enter the dashboard password.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={signIn} className="grid gap-4">
            <input type="hidden" name="next" value={next} />
            <Field label="Password">
              <Input type="password" name="password" required autoFocus autoComplete="current-password" />
            </Field>
            <SubmitButton>Sign in</SubmitButton>
          </ActionForm>
        </CardContent>
      </Card>
    </main>
  );
}
