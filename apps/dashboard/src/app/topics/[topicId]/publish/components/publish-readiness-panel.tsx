import type { PublicationOptionsView } from '@aicp/shared-types';
import { requestPublicationAction } from '../../actions';

export function PublishReadinessPanel({ topicId, options }: { topicId: string; options: PublicationOptionsView | null }) {
  return (
    <div className="panel stack">
      <h3>Channel readiness</h3>
      {!options ? <p className="empty-state">Publishing options unavailable.</p> : null}
      <div className="list">
        {options?.channels.map((option) => (
          <div className="list-item" key={option.channel}>
            <div>
              <strong>{option.channel}</strong>
              <p className="topic-meta">
                {option.ready
                  ? `Ready to publish using ${options.owner?.email ?? 'the requester account'}`
                  : `Missing ${option.missingRequirements.join(', ')}`}
              </p>
            </div>
            {option.ready ? (
              <form action={requestPublicationAction.bind(null, topicId, option.channel)}>
                <button className="button" type="submit">Publish</button>
              </form>
            ) : (
              <span className="pill pill-muted">Not ready</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
