import type { OpsHealthPayload, OpsReadinessPayload, WorkerRuntimeView } from '../../../lib/api-client';
import { DependencyCards, JsonToggle, ResponseCards, statusTone, TelemetryCards, TimestampCard } from './ops-shared';

export function RuntimeCard({
  title,
  health,
  readiness,
}: {
  title: string;
  health?: OpsHealthPayload | null;
  readiness?: OpsReadinessPayload | null;
}) {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Runtime</p>
          <h3>{title}</h3>
        </div>
        <span className="pill">{health?.service ?? title}</span>
      </div>
      <RuntimeStatusRows healthStatus={health?.status} readiness={readiness?.ready} />
      <RuntimeSummary health={health} readiness={readiness} />
      <RuntimeTelemetry health={health} readiness={readiness} />
      <RuntimeDependencies readiness={readiness} />
      <RuntimeJsonToggles health={health} readiness={readiness} />
    </section>
  );
}

function RuntimeStatusRows({ healthStatus, readiness }: { healthStatus?: string | null; readiness?: boolean }) {
  return (
    <>
      <div className="status-row">
        <span className={statusTone(healthStatus === 'ok')} />
        <strong>Health</strong>
        <span>{healthStatus ?? 'unknown'}</span>
      </div>
      <div className="status-row">
        <span className={statusTone(readiness)} />
        <strong>Ready</strong>
        <span>{readiness === undefined ? 'unknown' : String(readiness)}</span>
      </div>
    </>
  );
}

function RuntimeSummary({
  health,
  readiness,
}: {
  health?: OpsHealthPayload | null;
  readiness?: OpsReadinessPayload | null;
}) {
  return (
    <div>
      <p className="eyebrow">Health summary</p>
      <TimestampCard
        healthTimestamp={health?.timestamp}
        readinessTimestamp={readiness?.timestamp}
        healthEnv={health?.appEnv}
        readinessEnv={readiness?.appEnv}
        nodeEnv={health?.nodeEnv}
        uptimeSeconds={health?.uptimeSeconds}
      />
    </div>
  );
}

function RuntimeTelemetry({
  health,
  readiness,
}: {
  health?: OpsHealthPayload | null;
  readiness?: OpsReadinessPayload | null;
}) {
  return (
    <div>
      <p className="eyebrow">Telemetry</p>
      <TelemetryCards telemetry={(health?.telemetry ?? readiness?.telemetry) as Record<string, unknown> | undefined} />
    </div>
  );
}

function RuntimeDependencies({ readiness }: { readiness?: OpsReadinessPayload | null }) {
  return (
    <div>
      <p className="eyebrow">Dependencies</p>
      <DependencyCards dependencies={readiness?.dependencies as Record<string, unknown> | undefined} />
    </div>
  );
}

function RuntimeJsonToggles({
  health,
  readiness,
}: {
  health?: OpsHealthPayload | null;
  readiness?: OpsReadinessPayload | null;
}) {
  return (
    <div className="stack">
      <JsonToggle label="View health JSON" payload={health} />
      <JsonToggle label="View readiness JSON" payload={readiness} />
    </div>
  );
}

export function WorkerCard({ worker }: { worker: WorkerRuntimeView | null }) {
  if (!worker) {
    return <WorkerUnavailableCard />;
  }

  if (!worker.configured) {
    return <WorkerConfigurationCard worker={worker} />;
  }

  return <WorkerRuntimePanel worker={worker} />;
}

function WorkerUnavailableCard() {
  return (
    <section className="panel">
      <p className="empty-state">Worker runtime status is unavailable.</p>
    </section>
  );
}

function WorkerConfigurationCard({ worker }: { worker: WorkerRuntimeView }) {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Runtime</p>
          <h3>Worker</h3>
        </div>
        <span className="pill">Not configured</span>
      </div>
      <p className="empty-state">{worker.error ?? 'Set WORKER_HEALTH_BASE_URL on the API service.'}</p>
    </section>
  );
}

function WorkerRuntimePanel({ worker }: { worker: WorkerRuntimeView }) {
  const healthPayload = worker.health?.payload as Record<string, unknown> | null;
  const readinessPayload = worker.readiness?.payload as Record<string, unknown> | null;
  const metrics = healthPayload?.metrics as Record<string, unknown> | undefined;

  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Runtime</p>
          <h3>Worker</h3>
        </div>
        <span className="pill">{worker.baseUrl ?? 'configured'}</span>
      </div>
      <WorkerStatusRows worker={worker} />
      <WorkerSummaryCards worker={worker} healthPayload={healthPayload} metrics={metrics} />
      <WorkerTelemetry healthPayload={healthPayload} readinessPayload={readinessPayload} />
      <WorkerDependencies readinessPayload={readinessPayload} />
      <WorkerJsonToggles worker={worker} />
    </section>
  );
}

function WorkerStatusRows({ worker }: { worker: WorkerRuntimeView }) {
  return (
    <>
      <div className="status-row">
        <span className={statusTone(worker.health?.ok)} />
        <strong>Health</strong>
        <span>{worker.health?.statusCode ?? 'n/a'}</span>
      </div>
      <div className="status-row">
        <span className={statusTone(worker.readiness?.ok)} />
        <strong>Ready</strong>
        <span>{worker.readiness?.statusCode ?? 'n/a'}</span>
      </div>
    </>
  );
}

function WorkerSummaryCards({
  worker,
  healthPayload,
  metrics,
}: {
  worker: WorkerRuntimeView;
  healthPayload: Record<string, unknown> | null;
  metrics?: Record<string, unknown>;
}) {
  return (
    <div>
      <p className="eyebrow">Health summary</p>
      <ResponseCards
        items={[
          { label: 'Base URL', value: worker.baseUrl },
          { label: 'Service', value: healthPayload?.service },
          { label: 'Environment', value: healthPayload?.appEnv },
          { label: 'Node', value: healthPayload?.nodeEnv },
          { label: 'Uptime', value: healthPayload?.uptimeSeconds === undefined ? null : `${String(healthPayload.uptimeSeconds)}s` },
          { label: 'Jobs started', value: metrics?.jobsStarted },
          { label: 'Jobs failed', value: metrics?.jobsFailed },
          { label: 'Retries discarded', value: metrics?.retriesDiscarded },
        ]}
      />
    </div>
  );
}

function WorkerTelemetry({
  healthPayload,
  readinessPayload,
}: {
  healthPayload: Record<string, unknown> | null;
  readinessPayload: Record<string, unknown> | null;
}) {
  return (
    <div>
      <p className="eyebrow">Telemetry</p>
      <TelemetryCards telemetry={(healthPayload?.telemetry ?? readinessPayload?.telemetry) as Record<string, unknown> | undefined} />
    </div>
  );
}

function WorkerDependencies({ readinessPayload }: { readinessPayload: Record<string, unknown> | null }) {
  return (
    <div>
      <p className="eyebrow">Dependencies</p>
      <DependencyCards dependencies={(readinessPayload?.dependencies as Record<string, unknown> | undefined) ?? undefined} />
    </div>
  );
}

function WorkerJsonToggles({ worker }: { worker: WorkerRuntimeView }) {
  return (
    <div className="stack">
      <JsonToggle label="View worker health JSON" payload={worker.health?.payload ?? worker.health?.error} />
      <JsonToggle label="View worker readiness JSON" payload={worker.readiness?.payload ?? worker.readiness?.error} />
    </div>
  );
}
