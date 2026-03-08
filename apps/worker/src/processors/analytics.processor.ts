import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ANALYTICS_QUEUE, ANALYTICS_ROLLUP_DAILY_JOB, type AnalyticsRollupDailyJobPayload } from '@aicp/shared-types';
import { AnalyticsOrchestrator } from '../../../api/src/modules/analytics/analytics.orchestrator';
import { JobExecutionService } from '../support/job-execution.service';
import { withTelemetrySpan } from '../support/opentelemetry';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(ANALYTICS_QUEUE)
export class WorkerAnalyticsProcessor extends WorkerHost {
  constructor(
    private readonly orchestrator: AnalyticsOrchestrator,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(job: Job<AnalyticsRollupDailyJobPayload, any, string>): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name !== ANALYTICS_ROLLUP_DAILY_JOB) {
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return null;
      }

      const result = await withTelemetrySpan(
        `worker.${job.queueName}.${job.name}`,
        {
          'job.id': String(job.id ?? ''),
          'job.name': job.name,
          'queue.name': job.queueName,
          'usage.date': job.data?.usageDate,
        },
        async () => this.orchestrator.runDailyRollup(job.data.usageDate),
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
