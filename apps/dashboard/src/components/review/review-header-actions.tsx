import type { DraftVersionView } from '@aicp/contracts';
import { createReviewSessionAction } from '../../app/topics/[topicId]/actions';
import type { ReviewSessionView } from './review-page-data';

export function ReviewHeaderActions({
  topicId,
  draft,
  openSession,
}: {
  topicId: string;
  draft: DraftVersionView | null;
  openSession: ReviewSessionView | null;
}) {
  if (openSession || !draft) {
    return null;
  }

  return (
    <form action={createReviewSessionAction.bind(null, topicId, draft.id)}>
      <button className="button" type="submit">
        Create review session
      </button>
    </form>
  );
}
