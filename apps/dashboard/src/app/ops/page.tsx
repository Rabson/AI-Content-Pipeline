import { getDashboardUser } from '../../lib/auth';
import { getFailedJobs, getFailedPublications, getOpsRuntimeStatus, getQueueMetrics, getSecurityEvents } from '../../lib/api-client';
import { FailedJobsPanel, QueueMetricsPanel } from './components/queue-panels';
import { FailedPublicationsPanel, SecurityEventsPanel } from './components/publication-security-panels';
import { RuntimeCard, WorkerCard } from './components/runtime-panels';

export const dynamic = 'force-dynamic';

export default async function OpsPage() {
  const user = await getDashboardUser();

  if (!user.authorized || user.role !== 'ADMIN') {
    return (
      <main className="page stack">
        <section className="panel">
          <p className="empty-state">Ops is restricted to admin users.</p>
        </section>
      </main>
    );
  }

  const [runtime, queueMetrics, failedJobs, failedPublications, securityEvents] = await Promise.all([
    getOpsRuntimeStatus(),
    getQueueMetrics(),
    getFailedJobs(),
    getFailedPublications(),
    getSecurityEvents(),
  ]);

  return (
    <main className="page stack">
      <section className="detail-header">
        <p className="eyebrow">Ops</p>
        <h2>Runtime health and queue status</h2>
        <p className="lede">
          This page surfaces API health/readiness, worker status, BullMQ queue counts, and recent failed jobs from the ops endpoints.
        </p>
      </section>

      <section className="grid-two">
        <RuntimeCard title="API" health={runtime?.api.health ?? null} readiness={runtime?.api.readiness ?? null} />
        <WorkerCard worker={runtime?.worker ?? null} />
      </section>

      <section className="grid-two">
        <QueueMetricsPanel
          queues={queueMetrics?.queues ?? {}}
          executionsLast24Hours={queueMetrics?.executionsLast24Hours ?? {}}
        />
        <FailedJobsPanel jobs={failedJobs} />
      </section>

      <section className="grid-two">
        <FailedPublicationsPanel publications={failedPublications} />
        <SecurityEventsPanel events={securityEvents} />
      </section>
    </main>
  );
}
