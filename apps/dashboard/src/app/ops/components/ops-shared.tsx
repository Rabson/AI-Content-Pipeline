import { formatDate } from '../../../lib/formatting';

export function statusTone(ok: boolean | undefined) {
  if (ok === true) {
    return 'status-dot status-dot-ok';
  }
  if (ok === false) {
    return 'status-dot status-dot-bad';
  }
  return 'status-dot status-dot-warn';
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'n/a';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

export function ResponseCards({
  items,
}: {
  items: Array<{ label: string; value: unknown }>;
}) {
  return (
    <div className="ops-card-grid">
      {items.map((item) => (
        <div className="ops-data-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{formatValue(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export function JsonToggle({
  label,
  payload,
}: {
  label: string;
  payload: unknown;
}) {
  return (
    <details className="json-toggle">
      <summary>{label}</summary>
      <pre className="code-block">{JSON.stringify(payload ?? {}, null, 2)}</pre>
    </details>
  );
}

export function DependencyCards({
  dependencies,
}: {
  dependencies?: Record<string, unknown>;
}) {
  if (!dependencies || !Object.keys(dependencies).length) {
    return <p className="empty-state">No dependency payload returned.</p>;
  }

  return (
    <div className="ops-card-grid">
      {Object.entries(dependencies).map(([key, value]) => {
        const payload = value as Record<string, unknown> | undefined;
        const counts = payload?.counts as Record<string, unknown> | undefined;

        return (
          <div className="ops-data-card" key={key}>
            <span>{key}</span>
            <strong>{formatValue(payload?.ok ?? 'n/a')}</strong>
            {payload?.name ? <small>{String(payload.name)}</small> : null}
            {counts ? (
              <small>
                waiting {formatValue(counts.waiting)} · active {formatValue(counts.active)} · failed {formatValue(counts.failed)}
              </small>
            ) : payload?.error ? (
              <small>{String(payload.error)}</small>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function TelemetryCards({
  telemetry,
}: {
  telemetry?: Record<string, unknown>;
}) {
  if (!telemetry) {
    return <p className="empty-state">No telemetry payload returned.</p>;
  }

  return (
    <ResponseCards
      items={[
        { label: 'Enabled', value: telemetry.enabled },
        { label: 'Started', value: telemetry.started },
        { label: 'Exporter', value: telemetry.exporter },
        { label: 'Endpoint', value: telemetry.endpoint },
      ]}
    />
  );
}

export function TimestampCard({
  healthTimestamp,
  readinessTimestamp,
  healthEnv,
  readinessEnv,
  nodeEnv,
  uptimeSeconds,
}: {
  healthTimestamp?: string | null;
  readinessTimestamp?: string | null;
  healthEnv?: string | null;
  readinessEnv?: string | null;
  nodeEnv?: string | null;
  uptimeSeconds?: number | null;
}) {
  return (
    <ResponseCards
      items={[
        { label: 'Environment', value: healthEnv ?? readinessEnv },
        { label: 'Node', value: nodeEnv },
        { label: 'Uptime', value: uptimeSeconds === undefined || uptimeSeconds === null ? null : `${uptimeSeconds}s` },
        { label: 'Timestamp', value: formatDate(healthTimestamp ?? readinessTimestamp ?? null) },
      ]}
    />
  );
}
