import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  CONTENT_PIPELINE_QUEUE,
  REVISION_APPLY_FINALIZE_JOB,
  REVISION_APPLY_SECTION_JOB,
  REVISION_APPLY_START_JOB,
} from '../constants/revision.constants';
import { RevisionOrchestrator } from '../revision.orchestrator';

@Processor(CONTENT_PIPELINE_QUEUE)
export class RevisionProcessor extends WorkerHost {
  constructor(private readonly orchestrator: RevisionOrchestrator) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === REVISION_APPLY_START_JOB) {
      return { started: true, revisionRunId: job.data.revisionRunId };
    }

    if (job.name === REVISION_APPLY_SECTION_JOB) {
      return this.orchestrator.processRevisionSection(job.data);
    }

    if (job.name === REVISION_APPLY_FINALIZE_JOB) {
      return this.orchestrator.finalizeRevision(job.data.revisionRunId);
    }

    return null;
  }
}
