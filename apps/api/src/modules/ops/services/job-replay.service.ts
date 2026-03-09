import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JobExecutionStatus, Prisma, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { withQueueContractEnvelope } from '@aicp/queue-contracts';
import { SecurityEventService } from '@api/common/security/security-event.service';
import { resolveQueueTraceMetadata } from '@api/common/queue/trace-metadata.util';
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
    if (execution.status !== JobExecutionStatus.FAILED) {
      throw new BadRequestException('Only failed job executions can be replayed');
    }

    const payload =
      execution.payloadJson && typeof execution.payloadJson === 'object'
        ? (execution.payloadJson as Prisma.JsonObject)
        : {};

    const replayJobId = `replay:${execution.queueName}:${execution.jobName}:${execution.id}`;
    const queue = this.queueRegistry.resolve(execution.queueName);
    const existingJob = await queue.getJob(replayJobId);
    if (existingJob) {
      return {
        replayed: true,
        executionId,
        jobId: existingJob.id ?? replayJobId,
        actorId,
        idempotent: true,
      };
    }

    const trace = resolveQueueTraceMetadata(payload);
    const job = await queue.add(execution.jobName, withQueueContractEnvelope(payload, { idempotencyKey: replayJobId, ...trace }), {
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
