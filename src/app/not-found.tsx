import { FileQuestion } from 'lucide-react';
import { EmptyState, LinkButton } from '@/components/ui';

/** An address that matches no page. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <EmptyState icon={FileQuestion} title="Page not found" action={<LinkButton href="/" variant="primary">Back to the overview</LinkButton>}>
        This address does not exist.
      </EmptyState>
    </main>
  );
}
