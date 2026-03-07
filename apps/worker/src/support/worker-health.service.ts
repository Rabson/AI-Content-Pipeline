import { Injectable } from '@nestjs/common';
import { env } from '../config/env';
import { getTelemetryStatus } from './opentelemetry';
import { DatabaseHealthRepository } from './health/database-health.repository';
import { RedisHealthClient } from './health/redis-health.client';
import { QueueHealthService } from './health/queue-health.service';
import { WorkerMetricsService } from './worker-metrics.service';

@Injectable()
export class WorkerHealthService {
  constructor(
    private readonly databaseHealthRepository: DatabaseHealthRepository,
    private readonly redisHealthClient: RedisHealthClient,
    private readonly queueHealthService: QueueHealthService,
    private readonly metrics: WorkerMetricsService,
  ) { }

  async health() {
    return {
      status: 'ok',
      service: 'worker',
      appEnv: env.appEnv,
      nodeEnv: env.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      telemetry: getTelemetryStatus(),
      metrics: this.metrics.snapshot(),
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
      service: 'worker',
      appEnv: env.appEnv,
      telemetry: getTelemetryStatus(),
      dependencies: { database, redis, queues },
      timestamp: new Date().toISOString(),
    };
  }
}
