import { FileQuestion } from 'lucide-react';
import { EmptyState, LinkButton } from '@/components/ui';

/** A link to something that does not exist (or no longer does). */
export default function NotFound() {
  return (
    <div className="pt-16">
      <EmptyState icon={FileQuestion} title="No encontramos el registro" action={<LinkButton href="/" variant="primary">Volver al resumen</LinkButton>}>
        Esta página o registro no existe o se eliminó.
      </EmptyState>
    </div>
  );
}
