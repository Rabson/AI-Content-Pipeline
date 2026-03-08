import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { SecurityEventService } from '@api/common/security/security-event.service';
import { WorkflowService } from '@api/modules/workflow/workflow.service';
import { JobExecutionRepository } from '../repositories/job-execution.repository';
import { QueueRegistryService } from './queue-registry.service';

@Injectable()
export class JobReplayService {
  constructor(
    private readonly jobExecutionRepository: JobExecutionRepository,
    private readonly workflowService: WorkflowService,
    private readonly queueRegistry: QueueRegistryService,
    private readonly securityEventService: SecurityEventService,
  ) {}

  async replayExecution(executionId: string, actorId: string) {
    await this.securityEventService.replayRequested({
      actorUserId: actorId,
      resourceType: 'job-execution',
      resourceId: executionId,
      executionId,
    });
    const execution = await this.jobExecutionRepository.findExecutionById(executionId);
    if (!execution) {
      throw new NotFoundException('Job execution not found');
    }

    const payload =
      execution.payloadJson && typeof execution.payloadJson === 'object'
        ? (execution.payloadJson as Prisma.JsonObject)
        : {};

    const replayJobId = `replay:${execution.jobName}:${execution.id}:${Date.now()}`;
    const queue = this.queueRegistry.resolve(execution.queueName);
    const job = await queue.add(execution.jobName, payload, {
      jobId: replayJobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000,
      },
    });

    await this.recordReplayEvent(payload, executionId, execution.queueName, execution.jobName, actorId, job.id ?? replayJobId);

    return {
      replayed: true,
      executionId,
      jobId: job.id ?? replayJobId,
      actorId,
    };
  }

  private async recordReplayEvent(
    payload: Prisma.JsonObject,
    executionId: string,
    queueName: string,
    jobName: string,
    actorId: string,
    replayJobId: string,
  ) {
    const topicId = typeof payload.topicId === 'string' ? payload.topicId : undefined;
    if (!topicId) {
      return;
    }

    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.OPS,
      eventType: WorkflowEventType.REPLAY_REQUESTED,
      actorId,
      metadata: { executionId, replayJobId, queueName, jobName },
    });
  }
}
