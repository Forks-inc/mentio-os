'use client';

/** A loading failure lands here instead of a blank page: shadcn's Alert. */
import { AlertCircle } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>No pudimos cargar los datos de la campaña.</AlertTitle>
      <AlertDescription>
        <p>Ocurrió un problema temporal. Inténtalo de nuevo en unos momentos.</p>
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={reset}>Intentar de nuevo</Button>
      </AlertAction>
    </Alert>
  );
}
