import { readBoolean, readOptional, readString, readNumber } from '@aicp/shared-config/env/readers';

export const env = {
  appEnv: readString('APP_ENV', 'local'),
  nodeEnv: readString('NODE_ENV', 'development'),
  internalApiBaseUrl: readString('INTERNAL_API_BASE_URL', 'http://localhost:3001/api'),
  internalServiceJwtSecret: readString('INTERNAL_SERVICE_JWT_SECRET', 'local-dev-internal-service-secret'),
  internalServiceJwtIssuer: readString('INTERNAL_SERVICE_JWT_ISSUER', 'aicp-api'),
  internalServiceJwtAudience: readString('INTERNAL_SERVICE_JWT_AUDIENCE', 'aicp-api'),
  internalServiceJwtTtlSeconds: readNumber('INTERNAL_SERVICE_JWT_TTL_SECONDS', 300),
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
