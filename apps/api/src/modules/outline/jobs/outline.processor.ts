import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CONTENT_PIPELINE_QUEUE, OUTLINE_GENERATE_JOB } from '../constants/outline.constants';
import { OutlineOrchestrator } from '../outline.orchestrator';

@Processor(CONTENT_PIPELINE_QUEUE)
export class OutlineProcessor extends WorkerHost {
  constructor(private readonly orchestrator: OutlineOrchestrator) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name !== OUTLINE_GENERATE_JOB) {
      return null;
    }

    return this.orchestrator.run(job.data.topicId);
  }
}
