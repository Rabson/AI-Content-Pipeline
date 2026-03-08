import type { PublicationView } from '@aicp/shared-types';
import { formatDate } from '../../../../../lib/formatting';
import { retryPublicationAction } from '../../actions';

export function PublicationHistoryPanel({ topicId, publications }: { topicId: string; publications: PublicationView[] }) {
  return (
    <div className="panel">
      <h3>Publish history</h3>
      <div className="list">
        {publications.map((publication) => (
          <div className="list-item" key={publication.id}>
            <div>
              <strong>{publication.title} · {publication.channel}</strong>
              <p>{publication.externalUrl ?? publication.error ?? 'Pending external URL.'}</p>
              <p className="topic-meta">Created {formatDate(publication.createdAt)}</p>
              <p className="topic-meta">Publisher: {publication.publisherUser?.email ?? 'system default'}</p>
              <p className="topic-meta">Verification: {publication.verificationStatus ?? 'pending'}</p>
            </div>
            <div className="stack stack-tight">
              <span className="pill">{publication.status}</span>
              {publication.status === 'FAILED' ? (
                <form action={retryPublicationAction.bind(null, topicId, publication.id)}>
                  <button className="button button-secondary" type="submit">Retry publish</button>
                </form>
              ) : null}
            </div>
          </div>
        ))}
        {!publications.length ? <p className="empty-state">No publication attempts yet.</p> : null}
      </div>
    </div>
  );
}
