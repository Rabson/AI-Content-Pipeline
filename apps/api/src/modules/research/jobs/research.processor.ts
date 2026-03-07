import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CONTENT_PIPELINE_QUEUE, RESEARCH_RUN_JOB } from '../constants/research.constants';
import { ResearchOrchestrator } from '../research.orchestrator';

@Processor(CONTENT_PIPELINE_QUEUE)
export class ResearchProcessor extends WorkerHost {
  constructor(private readonly orchestrator: ResearchOrchestrator) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name !== RESEARCH_RUN_JOB) {
      return null;
    }

    return this.orchestrator.run(job.data.topicId, job.data.traceId);
  }
}
