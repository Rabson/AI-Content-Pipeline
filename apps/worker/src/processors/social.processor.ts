import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  SOCIAL_LINKEDIN_GENERATE_JOB,
  SOCIAL_QUEUE,
  assertSupportedQueueContractVersion,
  type SocialLinkedInGenerateJobPayload,
} from '@aicp/queue-contracts';
import { SOCIAL_JOB_RUNNER, type SocialJobRunner } from '../contracts/job-runners.contracts';
import { JobExecutionService } from '../support/job-execution.service';
import { withTelemetrySpan } from '../support/opentelemetry';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(SOCIAL_QUEUE)
export class WorkerSocialProcessor extends WorkerHost {
  constructor(
    @Inject(SOCIAL_JOB_RUNNER) private readonly orchestrator: SocialJobRunner,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(job: Job<SocialLinkedInGenerateJobPayload, any, string>): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name !== SOCIAL_LINKEDIN_GENERATE_JOB) {
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return null;
      }
      assertSupportedQueueContractVersion(job.data);

      const result = await withTelemetrySpan(
        `worker.${job.queueName}.${job.name}`,
        {
          'job.id': String(job.id ?? ''),
          'job.name': job.name,
          'queue.name': job.queueName,
          'topic.id': job.data?.topicId,
          'trace.id': job.data?.traceId ?? null,
          'request.id': job.data?.requestId ?? null,
          'queue.idempotency_key': job.data?.idempotencyKey ?? null,
        },
        async () => this.orchestrator.runLinkedIn(job.data.topicId),
      );
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
