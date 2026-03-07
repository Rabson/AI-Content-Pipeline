import type { WorkerRuntimeView } from '../../../../lib/api-client';
import { DependencyCards, JsonToggle, ResponseCards, statusTone, TelemetryCards } from '../ops-shared';

function WorkerStatusRows({ worker }: { worker: WorkerRuntimeView }) {
  return (
    <>
      <div className="status-row"><span className={statusTone(worker.health?.ok)} /><strong>Health</strong><span>{worker.health?.statusCode ?? 'n/a'}</span></div>
      <div className="status-row"><span className={statusTone(worker.readiness?.ok)} /><strong>Ready</strong><span>{worker.readiness?.statusCode ?? 'n/a'}</span></div>
    </>
  );
}

function WorkerRuntimePanel({ worker }: { worker: WorkerRuntimeView }) {
  const healthPayload = worker.health?.payload as Record<string, unknown> | null;
  const readinessPayload = worker.readiness?.payload as Record<string, unknown> | null;
  const metrics = healthPayload?.metrics as Record<string, unknown> | undefined;

  return (
    <section className="panel stack">
      <div className="panel-header"><div><p className="eyebrow">Runtime</p><h3>Worker</h3></div><span className="pill">{worker.baseUrl ?? 'configured'}</span></div>
      <WorkerStatusRows worker={worker} />
      <div><p className="eyebrow">Health summary</p><ResponseCards items={[{ label: 'Base URL', value: worker.baseUrl }, { label: 'Service', value: healthPayload?.service }, { label: 'Environment', value: healthPayload?.appEnv }, { label: 'Node', value: healthPayload?.nodeEnv }, { label: 'Uptime', value: healthPayload?.uptimeSeconds === undefined ? null : `${String(healthPayload.uptimeSeconds)}s` }, { label: 'Jobs started', value: metrics?.jobsStarted }, { label: 'Jobs failed', value: metrics?.jobsFailed }, { label: 'Retries discarded', value: metrics?.retriesDiscarded }]} /></div>
      <div><p className="eyebrow">Telemetry</p><TelemetryCards telemetry={(healthPayload?.telemetry ?? readinessPayload?.telemetry) as Record<string, unknown> | undefined} /></div>
      <div><p className="eyebrow">Dependencies</p><DependencyCards dependencies={(readinessPayload?.dependencies as Record<string, unknown> | undefined) ?? undefined} /></div>
      <div className="stack"><JsonToggle label="View worker health JSON" payload={worker.health?.payload ?? worker.health?.error} /><JsonToggle label="View worker readiness JSON" payload={worker.readiness?.payload ?? worker.readiness?.error} /></div>
    </section>
  );
}

export function WorkerCard({ worker }: { worker: WorkerRuntimeView | null }) {
  if (!worker) {
    return <section className="panel"><p className="empty-state">Worker runtime status is unavailable.</p></section>;
  }
  if (!worker.configured) {
    return <section className="panel stack"><div className="panel-header"><div><p className="eyebrow">Runtime</p><h3>Worker</h3></div><span className="pill">Not configured</span></div><p className="empty-state">{worker.error ?? 'Set WORKER_HEALTH_BASE_URL on the API service.'}</p></section>;
  }
  return <WorkerRuntimePanel worker={worker} />;
}
