import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { CONTENT_PIPELINE_QUEUE, RESEARCH_RUN_JOB, type ResearchRunJobPayload } from '@aicp/queue-contracts';
import { RESEARCH_JOB_RUNNER, type ResearchJobRunner } from '../contracts/job-runners.contracts';
import { JobExecutionService } from '../support/job-execution.service';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(CONTENT_PIPELINE_QUEUE)
export class WorkerResearchProcessor extends WorkerHost {
  constructor(
    @Inject(RESEARCH_JOB_RUNNER) private readonly orchestrator: ResearchJobRunner,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(job: Job<ResearchRunJobPayload, any, string>): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name !== RESEARCH_RUN_JOB) {
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return null;
      }

      const result = await this.orchestrator.run(job.data.topicId, job.data.traceId);
      this.metrics.recordSuccess(job.queueName);
      await this.jobExecutionService.succeed(execution.id);
      return result;
    } catch (error) {
      const classification = this.retryPolicyService.classify(error);
      if (!classification.retryable) {
        job.discard();
      }
      this.metrics.recordFailure(job.queueName, !classification.retryable);
      await this.jobExecutionService.fail(execution.id, error, classification.reason);
      throw error;
    }
  }
}
