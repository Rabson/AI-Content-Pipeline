import type { FailedPublicationView, SecurityEventView } from '../../../lib/api-client';
import { formatDate } from '../../../lib/formatting';
import { retryFailedPublicationFromOpsAction } from '../actions';

export function FailedPublicationsPanel({ publications }: { publications: FailedPublicationView[] }) {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div><p className="eyebrow">Publishing</p><h3>Failed publications</h3></div>
        <span className="pill">{publications.length} records</span>
      </div>
      <div className="list">
        {publications.map((publication) => (
          <div className="list-item" key={publication.id}>
            <div>
              <strong>{publication.title}</strong>
              <p>{publication.channel} · {publication.topic.title}</p>
              <p>{publication.error ?? 'No error message recorded.'}</p>
              <p className="topic-meta">Owner {publication.topic.owner?.email ?? 'n/a'} · Updated {formatDate(publication.updatedAt)}</p>
            </div>
            <div className="inline-actions">
              <span className="pill">{publication.status}</span>
              <form action={retryFailedPublicationFromOpsAction.bind(null, publication.id)}>
                <button className="button button-secondary" type="submit">Retry</button>
              </form>
            </div>
          </div>
        ))}
        {!publications.length ? <p className="empty-state">No failed publications were returned.</p> : null}
      </div>
    </section>
  );
}

export function SecurityEventsPanel({ events }: { events: SecurityEventView[] }) {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div><p className="eyebrow">Security</p><h3>Recent security events</h3></div>
        <span className="pill">{events.length} records</span>
      </div>
      <div className="list">
        {events.map((event) => (
          <div className="list-item" key={event.id}>
            <div>
              <strong>{event.eventType}</strong>
              <p>{event.subjectUser?.email ?? event.subjectEmail ?? 'unknown subject'}</p>
              <p>{event.path ?? event.resourceType ?? 'no resource context'}</p>
              <p className="topic-meta">Actor {event.actorUser?.email ?? 'system'} · {formatDate(event.createdAt)}</p>
            </div>
            <span className="pill">{event.metadata?.reason ? String(event.metadata.reason) : 'recorded'}</span>
          </div>
        ))}
        {!events.length ? <p className="empty-state">No security events were returned.</p> : null}
      </div>
    </section>
  );
}
