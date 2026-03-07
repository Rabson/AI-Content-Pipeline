import { Injectable } from '@nestjs/common';
import { env } from '../../config/env';
import { getTelemetryStatus } from '../../common/observability/opentelemetry';
import { RedisHealthClient } from './clients/redis-health.client';
import { DatabaseHealthRepository } from './repositories/database-health.repository';
import { QueueHealthService } from './services/queue-health.service';

@Injectable()
export class SystemService {
  constructor(
    private readonly databaseHealthRepository: DatabaseHealthRepository,
    private readonly redisHealthClient: RedisHealthClient,
    private readonly queueHealthService: QueueHealthService,
  ) {}

  async health() {
    return {
      status: 'ok',
      service: 'api',
      appEnv: env.appEnv,
      nodeEnv: env.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      telemetry: getTelemetryStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    const [database, redis, queues] = await Promise.all([
      this.databaseHealthRepository.check(),
      this.redisHealthClient.check(),
      this.queueHealthService.check(),
    ]);
    const ready = database.ok && redis.ok && Object.values(queues).every((entry: { ok: boolean }) => entry.ok);

    return {
      ready,
      service: 'api',
      appEnv: env.appEnv,
      telemetry: getTelemetryStatus(),
      dependencies: { database, redis, queues },
      timestamp: new Date().toISOString(),
    };
  }
}
