import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  PUBLISH_ARTICLE_JOB,
  PUBLISHING_QUEUE,
  assertSupportedQueueContractVersion,
  type PublishArticleJobPayload,
} from '@aicp/queue-contracts';
import { PUBLISH_JOB_RUNNER, type PublishJobRunner } from '../contracts/job-runners.contracts';
import { JobExecutionService } from '../support/job-execution.service';
import { withTelemetrySpan } from '../support/opentelemetry';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(PUBLISHING_QUEUE)
export class WorkerPublishProcessor extends WorkerHost {
  constructor(
    @Inject(PUBLISH_JOB_RUNNER) private readonly orchestrator: PublishJobRunner,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(job: Job<PublishArticleJobPayload, any, string>): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name !== PUBLISH_ARTICLE_JOB) {
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
        async () => this.orchestrator.publish(job.data),
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
