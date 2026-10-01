'use client';

/** A missing key or an API error lands here instead of a blank page: shadcn's Alert. */
import { AlertCircle } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Something went wrong talking to Mentio.</AlertTitle>
      <AlertDescription>
        <p>{error.message || 'The request failed.'}</p>
        <p>Check that MENTIO_API_KEY is set on the server and that the key is still active.</p>
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={reset}>Try again</Button>
      </AlertAction>
    </Alert>
  );
}
