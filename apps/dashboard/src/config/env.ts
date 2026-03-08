import { readBoolean, readNumber, readOptional, readString } from '@aicp/shared-config/env/readers';

const appEnv = readString('NEXT_PUBLIC_APP_ENV', 'local');

export const env = {
  appEnv,
  apiBase:
    readOptional('INTERNAL_API_BASE_URL') ??
    readOptional('API_BASE_URL') ??
    readString('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3001/api'),
  authRateLimitMaxAttempts: readNumber('AUTH_RATE_LIMIT_MAX_ATTEMPTS', 5),
  authRateLimitWindowMs: readNumber('AUTH_RATE_LIMIT_WINDOW_MS', 10 * 60 * 1000),
  redisUrl: readOptional('REDIS_URL'),
  internalServiceJwtSecret: readString('INTERNAL_SERVICE_JWT_SECRET', 'local-dev-internal-service-secret'),
  internalServiceJwtIssuer: readString('INTERNAL_SERVICE_JWT_ISSUER', 'aicp-dashboard'),
  internalServiceJwtAudience: readString('INTERNAL_SERVICE_JWT_AUDIENCE', 'aicp-api'),
  internalServiceJwtTtlSeconds: readNumber('INTERNAL_SERVICE_JWT_TTL_SECONDS', 60),
  sessionMaxAgeSeconds: readNumber('SESSION_MAX_AGE_SECONDS', 8 * 60 * 60),
  featurePhase2Enabled: readBoolean('NEXT_PUBLIC_FEATURE_PHASE2_ENABLED', appEnv === 'local'),
  featurePhase3Enabled: readBoolean('NEXT_PUBLIC_FEATURE_PHASE3_ENABLED', appEnv === 'local'),
  nextDistDir: readString('NEXT_DIST_DIR', '.next'),
  isLocal: appEnv === 'local',
} as const;
