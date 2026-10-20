import { FileQuestion } from 'lucide-react';
import { EmptyState, LinkButton } from '@/components/ui';

/** An address that matches no page. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <EmptyState icon={FileQuestion} title="No encontramos esta página" action={<LinkButton href="/" variant="primary">Volver al resumen</LinkButton>}>
        Esta dirección no existe.
      </EmptyState>
    </main>
  );
}
