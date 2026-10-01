import { FileQuestion } from 'lucide-react';
import { EmptyState, LinkButton } from '@/components/ui';

/** A link to something that does not exist (or no longer does). */
export default function NotFound() {
  return (
    <div className="pt-16">
      <EmptyState icon={FileQuestion} title="Not found" action={<LinkButton href="/" variant="primary">Back to the overview</LinkButton>}>
        This page or record does not exist, or it was deleted.
      </EmptyState>
    </div>
  );
}
