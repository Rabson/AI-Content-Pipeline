import { readBoolean, readOptional, readString, readNumber } from '@aicp/shared-config/env/readers';

export const env = {
  appEnv: readString('APP_ENV', 'local'),
  nodeEnv: readString('NODE_ENV', 'development'),
  redisUrl: readOptional('REDIS_URL'),
  queuePrefix: readString('QUEUE_PREFIX', 'ai-content'),
  workerMetricsPort: readNumber('WORKER_METRICS_PORT', 0),
  securityAlertThreshold: readNumber('SECURITY_ALERT_THRESHOLD', 5),
  securityAlertWindowMs: readNumber('SECURITY_ALERT_WINDOW_MS', 15 * 60 * 1000),
  otelEnabled: readBoolean('OTEL_ENABLED', false),
  otelExporterEndpoint: readOptional('OTEL_EXPORTER_OTLP_ENDPOINT'),
  otelTracesEndpoint: readOptional('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'),
  otelHeaders: readOptional('OTEL_EXPORTER_OTLP_HEADERS'),
  otelServiceNamespace: readString('OTEL_SERVICE_NAMESPACE', 'ai-content-pipeline'),
  otelLogLevel: readString('OTEL_LOG_LEVEL', 'error'),
} as const;
