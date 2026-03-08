import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { ResearchRunJobPayload } from '@aicp/shared-types';
import { buildQueueJobId } from '../../common/queue/job-id.util';
import { CONTENT_PIPELINE_QUEUE, RESEARCH_RUN_JOB } from './constants/topic-queue.constants';

@Injectable()
export class TopicQueueService {
  constructor(
    @InjectQueue(CONTENT_PIPELINE_QUEUE)
    private readonly contentPipelineQueue: Queue<ResearchRunJobPayload>,
  ) {}

  async enqueueResearch(payload: ResearchRunJobPayload): Promise<string> {
    const jobId = buildQueueJobId('research', 'topic', payload.topicId, 'v1');
    const existingJob = await this.contentPipelineQueue.getJob(jobId);
    if (existingJob) {
      return existingJob.id ?? jobId;
    }

    const job = await this.contentPipelineQueue.add(RESEARCH_RUN_JOB, payload, {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    return job.id ?? jobId;
  }
}
