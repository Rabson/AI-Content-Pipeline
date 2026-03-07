export interface AppEnv {
  APP_ENV?: 'local' | 'staging' | 'production';
  NODE_ENV?: string;
  PORT?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL_RESEARCH?: string;
  OPENAI_MODEL_DRAFT?: string;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  QUEUE_PREFIX?: string;
  AUTH_ALLOW_HEADER_BYPASS?: string;
  FEATURE_PHASE2_ENABLED?: string;
  FEATURE_PHASE3_ENABLED?: string;
  DISCOVERY_HN_API_BASE_URL?: string;
  OTEL_ENABLED?: string;
  OTEL_SERVICE_NAMESPACE?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?: string;
  OTEL_EXPORTER_OTLP_HEADERS?: string;
  OTEL_LOG_LEVEL?: string;
  STORAGE_PROVIDER?: string;
  STORAGE_BUCKET?: string;
  STORAGE_ENDPOINT?: string;
  STORAGE_PUBLIC_BASE_URL?: string;
  STORAGE_FORCE_PATH_STYLE?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  WORKER_METRICS_PORT?: string;
  WORKER_HEALTH_BASE_URL?: string;
  INTERNAL_API_BASE_URL?: string;
  API_BASE_URL?: string;
  NEXT_PUBLIC_API_BASE_URL?: string;
  NEXT_PUBLIC_APP_ENV?: string;
  NEXT_PUBLIC_FEATURE_PHASE2_ENABLED?: string;
  NEXT_PUBLIC_FEATURE_PHASE3_ENABLED?: string;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  DASHBOARD_ACCESS_CODE?: string;
  AUTH_ALLOWED_EMAIL_DOMAINS?: string;
  AUTH_ADMIN_EMAILS?: string;
  AUTH_REVIEWER_EMAILS?: string;
}

export function getEnv(name: keyof AppEnv, fallback?: string): string {
  const value = process.env[name];
  if (value && value.length > 0) {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${name}`);
}
