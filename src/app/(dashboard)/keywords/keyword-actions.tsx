/** Pause or resume, and delete: the two quick actions on a keyword. */
import type { Keyword } from '@mentio-dev/sdk';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { deleteKeywordAction, setMutedAction } from './actions';

export function KeywordActions({ keyword, backToList = false, size = 'sm' }: { keyword: Pick<Keyword, 'id' | 'term' | 'muted'>; backToList?: boolean; size?: 'sm' | 'md' }) {
  return (
    <div className="flex flex-wrap items-start justify-end gap-1.5">
      <ActionForm action={setMutedAction}>
        <input type="hidden" name="id" value={keyword.id} />
        <input type="hidden" name="muted" value={keyword.muted ? 'false' : 'true'} />
        <SubmitButton variant="secondary" size={size}>{keyword.muted ? 'Resume' : 'Pause'}</SubmitButton>
      </ActionForm>
      <ActionForm action={deleteKeywordAction}>
        <input type="hidden" name="id" value={keyword.id} />
        {backToList ? <input type="hidden" name="backToList" value="true" /> : null}
        <SubmitButton variant="danger" size={size} confirm={`Delete "${keyword.term}"? It stops tracking and its mentions are removed from this workspace.`}>
          Delete
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
