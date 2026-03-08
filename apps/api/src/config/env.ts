import {
  readBoolean,
  readOptional,
  readString,
  readNumber,
} from '@aicp/shared-config/env/readers';

const appEnv = readString('APP_ENV', 'local');
const csv = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const env = {
  appEnv,
  nodeEnv: readString('NODE_ENV', 'development'),
  port: readNumber('PORT', 3001),
  redisUrl: readOptional('REDIS_URL'),
  queuePrefix: readString('QUEUE_PREFIX', 'ai-content'),
  authAllowHeaderBypass: readBoolean('AUTH_ALLOW_HEADER_BYPASS', false),
  internalApiToken: readOptional('INTERNAL_API_TOKEN'),
  featurePhase2Enabled: readBoolean('FEATURE_PHASE2_ENABLED', appEnv === 'local'),
  featurePhase3Enabled: readBoolean('FEATURE_PHASE3_ENABLED', appEnv === 'local'),
  discoveryHnApiBaseUrl: readString('DISCOVERY_HN_API_BASE_URL', 'https://hn.algolia.com/api/v1/search_by_date'),
  discoveryAllowedHosts: csv(readOptional('DISCOVERY_ALLOWED_HOSTS') ?? 'hn.algolia.com'),
  openAiApiKey: readOptional('OPENAI_API_KEY'),
  openAiModelDraft: readString('OPENAI_MODEL_DRAFT', 'gpt-4.1-mini'),
  openAiModelResearch: readString('OPENAI_MODEL_RESEARCH', 'gpt-4.1-mini'),
  devtoApiKey: readOptional('DEVTO_API_KEY'),
  workerHealthBaseUrl: readOptional('WORKER_HEALTH_BASE_URL'),
  externalRequestTimeoutMs: readNumber('EXTERNAL_REQUEST_TIMEOUT_MS', 15000),
  apiCorsOrigins: csv(readOptional('API_CORS_ORIGINS') ?? 'http://localhost:3003'),
  requestBodyLimit: readString('API_REQUEST_BODY_LIMIT', '1mb'),
  securityAlertThreshold: readNumber('SECURITY_ALERT_THRESHOLD', 5),
  securityAlertWindowMs: readNumber('SECURITY_ALERT_WINDOW_MS', 15 * 60 * 1000),
  otelEnabled: readBoolean('OTEL_ENABLED', false),
  otelExporterEndpoint: readOptional('OTEL_EXPORTER_OTLP_ENDPOINT'),
  otelTracesEndpoint: readOptional('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'),
  otelHeaders: readOptional('OTEL_EXPORTER_OTLP_HEADERS'),
  otelServiceNamespace: readString('OTEL_SERVICE_NAMESPACE', 'ai-content-pipeline'),
  otelLogLevel: readString('OTEL_LOG_LEVEL', 'error'),
  storageProvider: readString('STORAGE_PROVIDER', 's3'),
  storageBucket: readOptional('STORAGE_BUCKET'),
  storageEndpoint: readOptional('STORAGE_ENDPOINT'),
  storagePublicBaseUrl: readOptional('STORAGE_PUBLIC_BASE_URL'),
  storageForcePathStyle: readBoolean('STORAGE_FORCE_PATH_STYLE', false),
  storageAllowedMimeTypes: csv(
    readOptional('STORAGE_ALLOWED_MIME_TYPES') ??
      'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,text/plain,text/markdown,application/pdf',
  ),
  storageMaxUploadBytes: readNumber('STORAGE_MAX_UPLOAD_BYTES', 10 * 1024 * 1024),
  awsAccessKeyId: readOptional('AWS_ACCESS_KEY_ID'),
  awsSecretAccessKey: readOptional('AWS_SECRET_ACCESS_KEY'),
  awsRegion: readString('AWS_REGION', 'auto'),
  userTokenEncryptionKey: readString('USER_TOKEN_ENCRYPTION_KEY', 'local-dev-user-token-key'),
} as const;
