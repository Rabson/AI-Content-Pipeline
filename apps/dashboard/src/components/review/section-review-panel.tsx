import { runRevisionAction, submitReviewAction } from '../../app/topics/[topicId]/actions';
import { ReviewCommentComposer, ReviewCommentsList } from './review-comments';
import type { DraftSectionPayload, ReviewSessionView } from './review-page-data';

function ReviewRevisionActions({
  topicId,
  reviewSessionId,
  sectionKey,
  commentIds,
}: {
  topicId: string;
  reviewSessionId: string;
  sectionKey: string;
  commentIds: string[];
}) {
  return (
    <>
      <form className="create-form" action={runRevisionAction.bind(null, topicId, reviewSessionId)}>
        <input type="hidden" name="sectionKey" value={sectionKey} />
        {commentIds.map((commentId) => (
          <input key={commentId} type="hidden" name="sourceCommentIds" value={commentId} />
        ))}
        <textarea name="instructionMd" rows={4} placeholder="Revision instruction for this section" required />
        <button className="button" type="submit">
          Run section revision
        </button>
      </form>
      <form action={submitReviewAction.bind(null, topicId, reviewSessionId)}>
        <button className="button button-secondary" type="submit">
          Submit review session
        </button>
      </form>
    </>
  );
}

export function SectionReviewPanel({
  topicId,
  sectionPayload,
  openSession,
}: {
  topicId: string;
  sectionPayload: DraftSectionPayload | null;
  openSession: ReviewSessionView | null;
}) {
  if (!sectionPayload) {
    return (
      <div className="panel stack">
        <h3>Section review</h3>
        <p className="empty-state">Pick a section to review.</p>
      </div>
    );
  }

  const commentIds = sectionPayload.comments.map((comment) => comment.id);

  return (
    <div className="panel stack">
      <h3>Section review</h3>
      <div className="stack">
        <strong>{sectionPayload.section.heading}</strong>
        <div className="code-block">{sectionPayload.section.contentMd ?? 'No markdown for this section.'}</div>
      </div>
      {openSession ? <ReviewCommentComposer topicId={topicId} reviewSessionId={openSession.id} sectionKey={sectionPayload.section.sectionKey} /> : null}
      <ReviewCommentsList
        topicId={topicId}
        reviewSessionId={openSession?.id ?? ''}
        comments={sectionPayload.comments}
        editable={Boolean(openSession)}
      />
      {openSession ? (
        <ReviewRevisionActions
          topicId={topicId}
          reviewSessionId={openSession.id}
          sectionKey={sectionPayload.section.sectionKey}
          commentIds={commentIds}
        />
      ) : null}
    </div>
  );
}
