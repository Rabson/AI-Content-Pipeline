import { DiagLogLevel } from '@opentelemetry/api';

export type TelemetryEnvironment = {
  appEnv: string;
  otelEnabled: boolean;
  otelExporterEndpoint?: string | null;
  otelTracesEndpoint?: string | null;
  otelHeaders?: string | null;
  otelServiceNamespace: string;
  otelLogLevel: string;
};

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

export function parseHeaders(value?: string | null): Record<string, string> {
  if (!value) return {};
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((headers, entry) => {
      const [key, ...rest] = entry.split('=');
      if (!key || rest.length === 0) return headers;
      headers[key.trim()] = rest.join('=').trim();
      return headers;
    }, {});
}

export function buildStatus(config: TelemetryEnvironment, serviceName: string): TelemetryStatus {
  const endpoint = config.otelTracesEndpoint ?? config.otelExporterEndpoint ?? null;
  return {
    enabled: config.otelEnabled,
    started: false,
    serviceName,
    serviceNamespace: config.otelServiceNamespace,
    exporter: config.otelEnabled && endpoint ? 'otlp-http' : 'disabled',
    endpoint,
    logLevel: config.otelLogLevel.toLowerCase(),
    lastError: null,
  };
}
