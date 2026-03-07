import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RevisionOrchestrator } from '../../../api/src/modules/revision/revision.orchestrator';
import { RevisionRepository } from '../../../api/src/modules/revision/revision.repository';
import { JobExecutionService } from '../support/job-execution.service';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

const CONTENT_PIPELINE_QUEUE = 'content.pipeline';
const REVISION_APPLY_START_JOB = 'revision.apply.start';
const REVISION_APPLY_SECTION_JOB = 'revision.apply.section';
const REVISION_APPLY_FINALIZE_JOB = 'revision.apply.finalize';

@Processor(CONTENT_PIPELINE_QUEUE)
export class WorkerRevisionProcessor extends WorkerHost {
  constructor(
    private readonly orchestrator: RevisionOrchestrator,
    private readonly repository: RevisionRepository,
    private readonly jobExecutionService: JobExecutionService,
    private readonly metrics: WorkerMetricsService,
    private readonly retryPolicyService: RetryPolicyService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.metrics.recordStart(job.queueName);
    const execution = await this.jobExecutionService.start(job);

    try {
      if (job.name === REVISION_APPLY_START_JOB) {
        this.metrics.recordSuccess(job.queueName);
        await this.jobExecutionService.succeed(execution.id);
        return { started: true, revisionRunId: job.data.revisionRunId };
      }

      if (job.name === REVISION_APPLY_SECTION_JOB) {
        const result = await this.orchestrator.processRevisionSection(job.data);
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
