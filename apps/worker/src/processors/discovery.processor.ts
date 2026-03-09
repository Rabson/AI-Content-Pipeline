import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { CONTENT_PIPELINE_QUEUE, DISCOVERY_IMPORT_JOB, type DiscoveryImportJobPayload } from '@aicp/queue-contracts';
import { DISCOVERY_JOB_RUNNER, type DiscoveryJobRunner } from '../contracts/job-runners.contracts';
import { JobExecutionService } from '../support/job-execution.service';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(CONTENT_PIPELINE_QUEUE)
export class WorkerDiscoveryProcessor extends WorkerHost {
  constructor(
    @Inject(DISCOVERY_JOB_RUNNER) private readonly discoveryService: DiscoveryJobRunner,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(job: Job<DiscoveryImportJobPayload, any, string>): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name !== DISCOVERY_IMPORT_JOB) {
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return null;
      }

      const result = await this.discoveryService.runImport(job.data);
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
