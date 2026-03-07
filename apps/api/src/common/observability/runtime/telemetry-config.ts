import { DiagLogLevel } from '@opentelemetry/api';

export type TelemetryStatus = {
  enabled: boolean;
  started: boolean;
  serviceName: string;
  serviceNamespace: string;
  exporter: 'disabled' | 'otlp-http';
  endpoint: string | null;
  logLevel: string;
  lastError: string | null;
};

export function parseDiagLogLevel(value?: string): DiagLogLevel {
  switch ((value ?? 'error').trim().toLowerCase()) {
    case 'none': return DiagLogLevel.NONE;
    case 'all': return DiagLogLevel.ALL;
    case 'verbose': return DiagLogLevel.VERBOSE;
    case 'debug': return DiagLogLevel.DEBUG;
    case 'info': return DiagLogLevel.INFO;
    case 'warn': return DiagLogLevel.WARN;
    default: return DiagLogLevel.ERROR;
  }
}

export function parseHeaders(value?: string): Record<string, string> {
  if (!value) return {};
  return value.split(',').map((entry) => entry.trim()).filter(Boolean).reduce<Record<string, string>>((headers, entry) => {
    const [key, ...rest] = entry.split('=');
    if (!key || rest.length === 0) return headers;
    headers[key.trim()] = rest.join('=').trim();
    return headers;
  }, {});
}

export function buildStatus(serviceName: string): TelemetryStatus {
  const enabled = (process.env.OTEL_ENABLED ?? 'false').toLowerCase() === 'true';
  const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? null;
  return {
    enabled,
    started: false,
    serviceName,
    serviceNamespace: process.env.OTEL_SERVICE_NAMESPACE ?? 'ai-content-pipeline',
    exporter: enabled && endpoint ? 'otlp-http' : 'disabled',
    endpoint,
    logLevel: (process.env.OTEL_LOG_LEVEL ?? 'error').toLowerCase(),
    lastError: null,
  };
}
