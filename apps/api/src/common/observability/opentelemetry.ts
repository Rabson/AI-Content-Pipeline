import {
  DiagConsoleLogger,
  DiagLogLevel,
  SpanStatusCode,
  context,
  diag,
  trace,
} from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';

type TelemetryStatus = {
  enabled: boolean;
  started: boolean;
  serviceName: string;
  serviceNamespace: string;
  exporter: 'disabled' | 'otlp-http';
  endpoint: string | null;
  logLevel: string;
  lastError: string | null;
};

let sdk: NodeSDK | null = null;
let telemetryStatus: TelemetryStatus = {
  enabled: false,
  started: false,
  serviceName: 'api',
  serviceNamespace: 'ai-content-pipeline',
  exporter: 'disabled',
  endpoint: null,
  logLevel: 'error',
  lastError: null,
};

function parseDiagLogLevel(value?: string): DiagLogLevel {
  switch ((value ?? 'error').trim().toLowerCase()) {
    case 'none':
      return DiagLogLevel.NONE;
    case 'all':
      return DiagLogLevel.ALL;
    case 'verbose':
      return DiagLogLevel.VERBOSE;
    case 'debug':
      return DiagLogLevel.DEBUG;
    case 'info':
      return DiagLogLevel.INFO;
    case 'warn':
      return DiagLogLevel.WARN;
    default:
      return DiagLogLevel.ERROR;
  }
}

function parseHeaders(value?: string): Record<string, string> {
  if (!value) {
    return {};
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((headers, entry) => {
      const [key, ...rest] = entry.split('=');
      if (!key || rest.length === 0) {
        return headers;
      }
      headers[key.trim()] = rest.join('=').trim();
      return headers;
    }, {});
}

function buildStatus(serviceName: string): TelemetryStatus {
  const enabled = (process.env.OTEL_ENABLED ?? 'false').toLowerCase() === 'true';
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
    null;

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

export async function startOpenTelemetry(serviceName: string) {
  if (sdk) {
    return getTelemetryStatus();
  }

  telemetryStatus = buildStatus(serviceName);
  if (!telemetryStatus.enabled) {
    return getTelemetryStatus();
  }

  if (!telemetryStatus.endpoint) {
    telemetryStatus.lastError = 'OTLP endpoint not configured';
    return getTelemetryStatus();
  }

  diag.setLogger(new DiagConsoleLogger(), parseDiagLogLevel(telemetryStatus.logLevel));

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': serviceName,
      'service.namespace': telemetryStatus.serviceNamespace,
      'deployment.environment': process.env.APP_ENV ?? 'local',
    }),
    traceExporter: new OTLPTraceExporter({
      url: telemetryStatus.endpoint,
      headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    await sdk.start();
    telemetryStatus.started = true;
    telemetryStatus.lastError = null;
  } catch (error) {
    telemetryStatus.started = false;
    telemetryStatus.lastError =
      error instanceof Error ? error.message : 'Failed to start OpenTelemetry';
    sdk = null;
  }

  return getTelemetryStatus();
}

export async function shutdownOpenTelemetry() {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = null;
  telemetryStatus.started = false;
}

export function getTelemetryStatus() {
  return { ...telemetryStatus };
}

export function getTraceContext() {
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();

  return {
    traceId: spanContext?.traceId ?? null,
    spanId: spanContext?.spanId ?? null,
    traceFlags: spanContext?.traceFlags ?? null,
  };
}

export async function withTelemetrySpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean | undefined>,
  handler: () => Promise<T>,
) {
  const tracer = trace.getTracer(telemetryStatus.serviceName);

  return tracer.startActiveSpan(name, async (span) => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined) {
        span.setAttribute(key, value);
      }
    });

    try {
      const result = await handler();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Telemetry span failed',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
