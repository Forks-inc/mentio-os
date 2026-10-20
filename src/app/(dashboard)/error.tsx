'use client';

/** A missing key or an API error lands here instead of a blank page: shadcn's Alert. */
import { AlertCircle } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
          <AlertTitle>No pudimos cargar los datos de la campaña.</AlertTitle>
      <AlertDescription>
        <p>La solicitud no se completó. Inténtalo de nuevo en unos momentos.</p>
        <p>Revisa que la clave de API esté configurada en el servidor y siga activa.</p>
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={reset}>Intentar de nuevo</Button>
      </AlertAction>
    </Alert>
  );
}
