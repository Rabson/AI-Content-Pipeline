import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  CONTENT_PIPELINE_QUEUE,
  REVISION_APPLY_FINALIZE_JOB,
  REVISION_APPLY_SECTION_JOB,
  REVISION_APPLY_START_JOB,
  type RevisionApplyFinalizeJobPayload,
  type RevisionApplySectionJobPayload,
  type RevisionApplyStartJobPayload,
} from '@aicp/queue-contracts';
import {
  REVISION_FAILURE_WRITER,
  type RevisionFailureWriter,
} from '../contracts/failure-writers.contracts';
import { REVISION_JOB_RUNNER, type RevisionJobRunner } from '../contracts/job-runners.contracts';
import { JobExecutionService } from '../support/job-execution.service';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(CONTENT_PIPELINE_QUEUE)
export class WorkerRevisionProcessor extends WorkerHost {
  constructor(
    @Inject(REVISION_JOB_RUNNER) private readonly orchestrator: RevisionJobRunner,
    @Inject(REVISION_FAILURE_WRITER) private readonly repository: RevisionFailureWriter,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(
    job: Job<RevisionApplyStartJobPayload | RevisionApplySectionJobPayload | RevisionApplyFinalizeJobPayload, any, string>,
  ): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name === REVISION_APPLY_START_JOB) {
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return { started: true, revisionRunId: job.data.revisionRunId };
      }

      if (job.name === REVISION_APPLY_SECTION_JOB) {
        const result = await this.orchestrator.processRevisionSection(job.data as RevisionApplySectionJobPayload);
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return result;
      }

      if (job.name === REVISION_APPLY_FINALIZE_JOB) {
        const result = await this.orchestrator.finalizeRevision(job.data.revisionRunId);
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return result;
      }

      this.metrics.recordSuccess(job.queueName);
      await this.jobExecutionService.succeed(execution.id);
      return null;
    } catch (error) {
      const classification = this.retryPolicyService.classify(error);
      if (!classification.retryable) {
        job.discard();
      }
      this.metrics.recordFailure(job.queueName, !classification.retryable);
      if (job.data?.revisionRunId) {
        await this.repository.markRevisionRunFailed(
          job.data.revisionRunId,
          error instanceof Error ? error.message : 'Revision job failed',
        );
      }
      await this.jobExecutionService.fail(execution.id, error, classification.reason);
      throw error;
    }
  }
}
