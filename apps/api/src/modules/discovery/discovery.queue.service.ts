import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { CONTENT_PIPELINE_QUEUE } from '../topic/constants/topic-queue.constants';
import { DISCOVERY_IMPORT_JOB } from './constants/discovery.constants';

export interface DiscoveryImportJobPayload {
  provider: string;
  query?: string;
  limit: number;
  audience?: string;
  tags?: string[];
  autoScore: boolean;
  minimumScore: number;
  actorId: string;
}

@Injectable()
export class DiscoveryQueueService {
  constructor(
    @InjectQueue(CONTENT_PIPELINE_QUEUE)
    private readonly contentPipelineQueue: Queue,
  ) {}

  async enqueueImport(payload: DiscoveryImportJobPayload): Promise<string> {
    const digest = createHash('sha1')
      .update(JSON.stringify({
        provider: payload.provider,
        query: payload.query ?? null,
        limit: payload.limit,
        actorId: payload.actorId,
      }))
      .digest('hex')
      .slice(0, 16);

    const jobId = `discovery:${payload.provider}:${digest}`;
    const existingJob = await this.contentPipelineQueue.getJob(jobId);
    if (existingJob) {
      return existingJob.id ?? jobId;
    }

    const job = await this.contentPipelineQueue.add(DISCOVERY_IMPORT_JOB, payload, {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 15000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    return job.id ?? jobId;
  }
}
