import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  CONTENT_PIPELINE_QUEUE,
  DISCOVERY_IMPORT_JOB,
  DRAFT_GENERATE_FINALIZE_JOB,
  DRAFT_GENERATE_SECTION_JOB,
  DRAFT_GENERATE_START_JOB,
  OUTLINE_GENERATE_JOB,
  RESEARCH_RUN_JOB,
  REVISION_APPLY_FINALIZE_JOB,
  REVISION_APPLY_SECTION_JOB,
  REVISION_APPLY_START_JOB,
  SEO_GENERATE_JOB,
} from '@aicp/queue-contracts';
import { ResearchOrchestrator } from '../../../api/src/modules/research/research.orchestrator';
import { OutlineOrchestrator } from '../../../api/src/modules/outline/outline.orchestrator';
import { OutlineRepository } from '../../../api/src/modules/outline/outline.repository';
import { DraftOrchestrator } from '../../../api/src/modules/draft/draft.orchestrator';
import { DraftRepository } from '../../../api/src/modules/draft/draft.repository';
import { RevisionOrchestrator } from '../../../api/src/modules/revision/revision.orchestrator';
import { RevisionRepository } from '../../../api/src/modules/revision/revision.repository';
import { SeoOrchestrator } from '../../../api/src/modules/seo/seo.orchestrator';
import { DiscoveryService } from '../../../api/src/modules/discovery/discovery.service';
import { JobExecutionService } from '../support/job-execution.service';
import { getTraceContext, withTelemetrySpan } from '../support/opentelemetry';
import { WorkerMetricsService } from '../support/worker-metrics.service';
import { RetryPolicyService } from '../support/retry-policy.service';

@Processor(CONTENT_PIPELINE_QUEUE)
export class WorkerContentPipelineProcessor extends WorkerHost {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly researchOrchestrator: ResearchOrchestrator,
    private readonly outlineOrchestrator: OutlineOrchestrator,
    private readonly outlineRepository: OutlineRepository,
    private readonly draftOrchestrator: DraftOrchestrator,
    private readonly draftRepository: DraftRepository,
    private readonly revisionOrchestrator: RevisionOrchestrator,
    private readonly revisionRepository: RevisionRepository,
    private readonly seoOrchestrator: SeoOrchestrator,
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
      const result = await withTelemetrySpan(
        `worker.${job.queueName}.${job.name}`,
        {
          'job.id': String(job.id ?? ''),
          'job.name': job.name,
          'queue.name': job.queueName,
          'topic.id': job.data?.topicId,
        },
        async () => this.route(job),
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
      await this.handleFailure(job, error);
      await this.jobExecutionService.fail(execution.id, error, classification.reason);
      throw error;
    }
  }

  private async route(job: Job<any, any, string>) {
    switch (job.name) {
      case DISCOVERY_IMPORT_JOB:
        return this.discoveryService.runImport(job.data);
      case RESEARCH_RUN_JOB:
        return this.researchOrchestrator.run(
          job.data.topicId,
          job.data.traceId ?? getTraceContext().traceId ?? undefined,
        );
      case OUTLINE_GENERATE_JOB:
        return this.outlineOrchestrator.run(job.data.topicId);
      case DRAFT_GENERATE_START_JOB:
        return { started: true, draftVersionId: job.data.draftVersionId };
      case DRAFT_GENERATE_SECTION_JOB:
        return this.draftOrchestrator.processSection(job.data);
      case DRAFT_GENERATE_FINALIZE_JOB:
        return this.draftOrchestrator.finalizeDraft(job.data.draftVersionId);
      case REVISION_APPLY_START_JOB:
        return { started: true, revisionRunId: job.data.revisionRunId };
      case REVISION_APPLY_SECTION_JOB:
        return this.revisionOrchestrator.processRevisionSection(job.data);
      case REVISION_APPLY_FINALIZE_JOB:
        return this.revisionOrchestrator.finalizeRevision(job.data.revisionRunId);
      case SEO_GENERATE_JOB:
        return this.seoOrchestrator.run(job.data.topicId);
      default:
        return null;
    }
  }

  private async handleFailure(job: Job<any, any, string>, error: unknown) {
    const message = error instanceof Error ? error.message : 'Worker job failed';

    if (job.name === OUTLINE_GENERATE_JOB && job.data?.topicId) {
      await this.outlineRepository.markFailed(job.data.topicId, message);
      return;
    }

    if ((job.name === DRAFT_GENERATE_SECTION_JOB || job.name === DRAFT_GENERATE_FINALIZE_JOB) && job.data?.draftVersionId) {
      await this.draftRepository.markDraftFailed(job.data.draftVersionId);
      return;
    }

    if ((job.name === REVISION_APPLY_SECTION_JOB || job.name === REVISION_APPLY_FINALIZE_JOB) && job.data?.revisionRunId) {
      await this.revisionRepository.markRevisionRunFailed(job.data.revisionRunId, message);
    }
  }
}
