import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  CONTENT_PIPELINE_QUEUE,
  DRAFT_GENERATE_FINALIZE_JOB,
  DRAFT_GENERATE_SECTION_JOB,
  DRAFT_GENERATE_START_JOB,
  type DraftGenerateFinalizeJobPayload,
  type DraftGenerateSectionJobPayload,
  type DraftGenerateStartJobPayload,
} from '@aicp/queue-contracts';
import { DraftOrchestrator } from '../../../api/src/modules/draft/draft.orchestrator';
import { DraftRepository } from '../../../api/src/modules/draft/draft.repository';
import { JobExecutionService } from '../support/job-execution.service';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(CONTENT_PIPELINE_QUEUE)
export class WorkerDraftProcessor extends WorkerHost {
  constructor(
    private readonly orchestrator: DraftOrchestrator,
    private readonly repository: DraftRepository,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(
    job: Job<DraftGenerateStartJobPayload | DraftGenerateSectionJobPayload | DraftGenerateFinalizeJobPayload, any, string>,
  ): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name === DRAFT_GENERATE_START_JOB) {
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return { started: true, draftVersionId: job.data.draftVersionId };
      }

      if (job.name === DRAFT_GENERATE_SECTION_JOB) {
        const result = await this.orchestrator.processSection(job.data as DraftGenerateSectionJobPayload);
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return result;
      }

      if (job.name === DRAFT_GENERATE_FINALIZE_JOB) {
        const result = await this.orchestrator.finalizeDraft(job.data.draftVersionId);
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
      if (job.data?.draftVersionId) {
        await this.repository.markDraftFailed(job.data.draftVersionId);
      }
      await this.jobExecutionService.fail(execution.id, error, classification.reason);
      throw error;
    }
  }
}
