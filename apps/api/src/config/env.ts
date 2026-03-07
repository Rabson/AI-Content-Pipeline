import {
  readBoolean,
  readOptional,
  readString,
  readNumber,
} from '@aicp/shared-config/env/readers';

const appEnv = readString('APP_ENV', 'local');

export const env = {
  appEnv,
  nodeEnv: readString('NODE_ENV', 'development'),
  port: readNumber('PORT', 3001),
  redisUrl: readOptional('REDIS_URL'),
  queuePrefix: readString('QUEUE_PREFIX', 'ai-content'),
  authAllowHeaderBypass: readBoolean('AUTH_ALLOW_HEADER_BYPASS', false),
  featurePhase2Enabled: readBoolean('FEATURE_PHASE2_ENABLED', appEnv === 'local'),
  featurePhase3Enabled: readBoolean('FEATURE_PHASE3_ENABLED', appEnv === 'local'),
  discoveryHnApiBaseUrl: readString('DISCOVERY_HN_API_BASE_URL', 'https://hn.algolia.com/api/v1/search_by_date'),
  openAiApiKey: readOptional('OPENAI_API_KEY'),
  openAiModelDraft: readString('OPENAI_MODEL_DRAFT', 'gpt-4.1-mini'),
  openAiModelResearch: readString('OPENAI_MODEL_RESEARCH', 'gpt-4.1-mini'),
  devtoApiKey: readOptional('DEVTO_API_KEY'),
  workerHealthBaseUrl: readOptional('WORKER_HEALTH_BASE_URL'),
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
  awsAccessKeyId: readOptional('AWS_ACCESS_KEY_ID'),
  awsSecretAccessKey: readOptional('AWS_SECRET_ACCESS_KEY'),
  awsRegion: readString('AWS_REGION', 'auto'),
} as const;
