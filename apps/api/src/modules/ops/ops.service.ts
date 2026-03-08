import { Injectable } from '@nestjs/common';
import { SecurityEventType } from '@prisma/client';
import { SecurityEventService } from '../../common/security/security-event.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { PublisherService } from '../publisher/publisher.service';
import { SystemService } from '../system/system.service';
import { WorkerRuntimeClient } from './clients/worker-runtime.client';
import { JobExecutionRepository } from './repositories/job-execution.repository';
import { JobReplayService } from './services/job-replay.service';
import { QueueMetricsService } from './services/queue-metrics.service';

@Injectable()
export class OpsService {
  constructor(
    private readonly systemService: SystemService,
    private readonly securityEventService: SecurityEventService,
    private readonly workerRuntimeClient: WorkerRuntimeClient,
    private readonly jobExecutionRepository: JobExecutionRepository,
    private readonly jobReplayService: JobReplayService,
    private readonly queueMetricsService: QueueMetricsService,
    private readonly publisherService: PublisherService,
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

  listSecurityEvents(limit = 50, eventType?: SecurityEventType) {
    return this.securityEventService.listRecent(limit, eventType);
  }

  listFailedPublications(limit = 20) {
    return this.publisherService.listFailedPublications(limit);
  }

  retryFailedPublication(publicationId: string, actor: AuthenticatedUser) {
    return this.publisherService.retryPublicationById(publicationId, actor);
  }
}
