import type { OpsHealthPayload, OpsReadinessPayload } from '../../../../lib/api-client';
import { DependencyCards, JsonToggle, statusTone, TelemetryCards, TimestampCard } from '../ops-shared';

function RuntimeStatusRows({ healthStatus, readiness }: { healthStatus?: string | null; readiness?: boolean }) {
  return (
    <>
      <div className="status-row"><span className={statusTone(healthStatus === 'ok')} /><strong>Health</strong><span>{healthStatus ?? 'unknown'}</span></div>
      <div className="status-row"><span className={statusTone(readiness)} /><strong>Ready</strong><span>{readiness === undefined ? 'unknown' : String(readiness)}</span></div>
    </>
  );
}

export function RuntimeCard({ title, health, readiness }: { title: string; health?: OpsHealthPayload | null; readiness?: OpsReadinessPayload | null }) {
  return (
    <section className="panel stack">
      <div className="panel-header"><div><p className="eyebrow">Runtime</p><h3>{title}</h3></div><span className="pill">{health?.service ?? title}</span></div>
      <RuntimeStatusRows healthStatus={health?.status} readiness={readiness?.ready} />
      <div><p className="eyebrow">Health summary</p><TimestampCard healthTimestamp={health?.timestamp} readinessTimestamp={readiness?.timestamp} healthEnv={health?.appEnv} readinessEnv={readiness?.appEnv} nodeEnv={health?.nodeEnv} uptimeSeconds={health?.uptimeSeconds} /></div>
      <div><p className="eyebrow">Telemetry</p><TelemetryCards telemetry={(health?.telemetry ?? readiness?.telemetry) as Record<string, unknown> | undefined} /></div>
      <div><p className="eyebrow">Dependencies</p><DependencyCards dependencies={readiness?.dependencies as Record<string, unknown> | undefined} /></div>
      <div className="stack"><JsonToggle label="View health JSON" payload={health} /><JsonToggle label="View readiness JSON" payload={readiness} /></div>
    </section>
  );
}
