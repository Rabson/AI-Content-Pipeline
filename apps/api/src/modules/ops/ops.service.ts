import { Injectable } from '@nestjs/common';
import { SystemService } from '../system/system.service';
import { WorkerRuntimeClient } from './clients/worker-runtime.client';
import { JobExecutionRepository } from './repositories/job-execution.repository';
import { JobReplayService } from './services/job-replay.service';
import { QueueMetricsService } from './services/queue-metrics.service';

@Injectable()
export class OpsService {
  constructor(
    private readonly systemService: SystemService,
    private readonly workerRuntimeClient: WorkerRuntimeClient,
    private readonly jobExecutionRepository: JobExecutionRepository,
    private readonly jobReplayService: JobReplayService,
    private readonly queueMetricsService: QueueMetricsService,
  ) {}

  async runtimeStatus() {
    const [apiHealth, apiReady, worker] = await Promise.all([
      this.systemService.health(),
      this.systemService.readiness(),
      this.workerRuntimeClient.runtimeStatus(),
    ]);

    return {
      api: {
        health: apiHealth,
        readiness: apiReady,
      },
      worker,
      timestamp: new Date().toISOString(),
    };
  }

  queueMetrics() {
    return this.queueMetricsService.snapshot();
  }

  listFailedExecutions(limit = 50) {
    return this.jobExecutionRepository.listFailedExecutions(limit);
  }

  replayExecution(executionId: string, actorId: string) {
    return this.jobReplayService.replayExecution(executionId, actorId);
  }
}
