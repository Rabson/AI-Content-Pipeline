import { readOptional, readString, readNumber } from '@aicp/shared-config/env/readers';

export const env = {
  appEnv: readString('APP_ENV', 'local'),
  nodeEnv: readString('NODE_ENV', 'development'),
  redisUrl: readOptional('REDIS_URL'),
  queuePrefix: readString('QUEUE_PREFIX', 'ai-content'),
  workerMetricsPort: readNumber('WORKER_METRICS_PORT', 0),
} as const;
