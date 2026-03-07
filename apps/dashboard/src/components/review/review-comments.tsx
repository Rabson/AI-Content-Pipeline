import type { ReviewCommentView } from '@aicp/shared-types';
import { createReviewCommentAction, updateReviewCommentAction } from '../../app/topics/[topicId]/actions';
import { formatDate } from '../../lib/formatting';

export function ReviewCommentComposer({
  topicId,
  reviewSessionId,
  sectionKey,
}: {
  topicId: string;
  reviewSessionId: string;
  sectionKey: string;
}) {
  return (
    <form className="create-form" action={createReviewCommentAction.bind(null, topicId, reviewSessionId)}>
      <input type="hidden" name="sectionKey" value={sectionKey} />
      <textarea name="commentMd" rows={4} placeholder="Comment for this section" required />
      <select name="severity" defaultValue="MAJOR">
        <option value="NIT">NIT</option>
        <option value="MAJOR">MAJOR</option>
        <option value="BLOCKER">BLOCKER</option>
      </select>
      <button className="button" type="submit">
        Add comment
      </button>
    </form>
  );
}

function ReviewCommentCard({
  topicId,
  reviewSessionId,
  comment,
  editable,
}: {
  topicId: string;
  reviewSessionId: string;
  comment: ReviewCommentView;
  editable: boolean;
}) {
  return (
    <div className="panel stack">
      <div>
        <strong>{comment.severity}</strong>
        <p>{comment.commentMd}</p>
        <p className="topic-meta">{formatDate(comment.createdAt)} · {comment.status}</p>
      </div>
      {editable ? (
        <form action={updateReviewCommentAction.bind(null, topicId, reviewSessionId, comment.id)} className="create-form">
          <select name="status" defaultValue={comment.status}>
            <option value="OPEN">OPEN</option>
            <option value="ADDRESSED">ADDRESSED</option>
            <option value="WONT_FIX">WONT_FIX</option>
          </select>
          <input name="resolutionNote" placeholder="Resolution note" defaultValue={comment.resolutionNote ?? ''} />
          <button className="button button-secondary" type="submit">
            Update comment
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function ReviewCommentsList({
  topicId,
  reviewSessionId,
  comments,
  editable,
}: {
  topicId: string;
  reviewSessionId: string;
  comments: ReviewCommentView[];
  editable: boolean;
}) {
  return (
    <div className="list">
      {comments.map((comment) => (
        <ReviewCommentCard
          key={comment.id}
          topicId={topicId}
          reviewSessionId={reviewSessionId}
          comment={comment}
          editable={editable}
        />
      ))}
      {!comments.length ? <p className="empty-state">No comments for this section yet.</p> : null}
    </div>
  );
}
