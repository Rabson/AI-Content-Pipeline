import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CONTENT_PIPELINE_QUEUE, OUTLINE_GENERATE_JOB, type OutlineGenerateJobPayload } from '@aicp/queue-contracts';
import { OutlineOrchestrator } from '../../../api/src/modules/outline/outline.orchestrator';
import { OutlineRepository } from '../../../api/src/modules/outline/outline.repository';
import { JobExecutionService } from '../support/job-execution.service';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(CONTENT_PIPELINE_QUEUE)
export class WorkerOutlineProcessor extends WorkerHost {
  constructor(
    private readonly orchestrator: OutlineOrchestrator,
    private readonly repository: OutlineRepository,
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
