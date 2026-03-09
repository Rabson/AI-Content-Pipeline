import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { CONTENT_PIPELINE_QUEUE, OUTLINE_GENERATE_JOB, type OutlineGenerateJobPayload } from '@aicp/queue-contracts';
import {
  OUTLINE_FAILURE_WRITER,
  type OutlineFailureWriter,
} from '../contracts/failure-writers.contracts';
import { OUTLINE_JOB_RUNNER, type OutlineJobRunner } from '../contracts/job-runners.contracts';
import { JobExecutionService } from '../support/job-execution.service';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(CONTENT_PIPELINE_QUEUE)
export class WorkerOutlineProcessor extends WorkerHost {
  constructor(
    @Inject(OUTLINE_JOB_RUNNER) private readonly orchestrator: OutlineJobRunner,
    @Inject(OUTLINE_FAILURE_WRITER) private readonly repository: OutlineFailureWriter,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(job: Job<OutlineGenerateJobPayload, any, string>): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name !== OUTLINE_GENERATE_JOB) {
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return null;
      }

      const result = await this.orchestrator.run(job.data.topicId);
      this.metrics.recordSuccess(job.queueName);
      await this.jobExecutionService.succeed(execution.id);
      return result;
    } catch (error) {
      const classification = this.retryPolicyService.classify(error);
      if (!classification.retryable) {
        job.discard();
      }
      this.metrics.recordFailure(job.queueName, !classification.retryable);
      await this.repository.markFailed(
        job.data.topicId,
        error instanceof Error ? error.message : 'Outline generation failed',
      );
      await this.jobExecutionService.fail(execution.id, error, classification.reason);
      throw error;
    }
  }
}
