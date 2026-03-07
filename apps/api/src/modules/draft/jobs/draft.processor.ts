import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  CONTENT_PIPELINE_QUEUE,
  DRAFT_GENERATE_FINALIZE_JOB,
  DRAFT_GENERATE_SECTION_JOB,
  DRAFT_GENERATE_START_JOB,
} from '../constants/draft.constants';
import { DraftOrchestrator } from '../draft.orchestrator';

@Processor(CONTENT_PIPELINE_QUEUE)
export class DraftProcessor extends WorkerHost {
  constructor(private readonly orchestrator: DraftOrchestrator) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === DRAFT_GENERATE_START_JOB) {
      return { started: true, draftVersionId: job.data.draftVersionId };
    }

    if (job.name === DRAFT_GENERATE_SECTION_JOB) {
      return this.orchestrator.processSection(job.data);
    }

    if (job.name === DRAFT_GENERATE_FINALIZE_JOB) {
      return this.orchestrator.finalizeDraft(job.data.draftVersionId);
    }

    return null;
  }
}
