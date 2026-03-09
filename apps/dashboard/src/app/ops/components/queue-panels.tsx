import type { FailedJobView } from '../../../lib/api-client';
import { formatDate } from '../../../lib/formatting';

export function QueueMetricsPanel({
  queues,
  executionsLast24Hours,
}: {
  queues: Record<string, Record<string, number>>;
  executionsLast24Hours: Record<string, Record<string, number>>;
}) {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">BullMQ</p>
          <h3>Queue metrics</h3>
        </div>
      </div>
      <div className="list">
        {Object.entries(queues).map(([queueName, counts]) => (
          <div className="list-item" key={queueName}>
            <div>
              <strong>{queueName}</strong>
              <p>
                waiting {counts.waiting ?? 0} · active {counts.active ?? 0} · delayed {counts.delayed ?? 0}
              </p>
            </div>
            <span className="pill">failed {counts.failed ?? 0}</span>
          </div>
        ))}
        {!Object.keys(queues).length ? <p className="empty-state">No queue metrics returned.</p> : null}
      </div>
      <div>
        <p className="eyebrow">Executions in last 24 hours</p>
        <pre className="code-block">{JSON.stringify(executionsLast24Hours, null, 2)}</pre>
      </div>
    </section>
  );
}

export function FailedJobsPanel({ jobs }: { jobs: FailedJobView[] }) {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Recovery</p>
          <h3>Recent failed jobs</h3>
        </div>
        <span className="pill">{jobs.length} records</span>
      </div>
      <div className="list">
        {jobs.map((job) => (
          <div className="list-item" key={job.id}>
            <div>
              <strong>{job.jobName}</strong>
              <p>{job.queueName}</p>
              <p>{job.errorMessage ?? 'No error message recorded.'}</p>
              <p className="topic-meta">Trace {job.traceId ?? 'n/a'} · Request {job.requestId ?? 'n/a'}</p>
              <p className="topic-meta">Started {formatDate(job.startedAt)}</p>
            </div>
            <span className="pill">{job.status}</span>
          </div>
        ))}
        {!jobs.length ? <p className="empty-state">No failed jobs were returned.</p> : null}
      </div>
    </section>
  );
}
