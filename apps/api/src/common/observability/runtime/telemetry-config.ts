import { DiagLogLevel } from '@opentelemetry/api';
import { env } from '../../../config/env';

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
  const enabled = env.otelEnabled;
  const endpoint = env.otelTracesEndpoint ?? env.otelExporterEndpoint ?? null;
  return {
    enabled,
    started: false,
    serviceName,
    serviceNamespace: env.otelServiceNamespace,
    exporter: enabled && endpoint ? 'otlp-http' : 'disabled',
    endpoint,
    logLevel: env.otelLogLevel.toLowerCase(),
    lastError: null,
  };
}
