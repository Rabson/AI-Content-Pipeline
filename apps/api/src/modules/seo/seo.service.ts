import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { SeoGenerateJobPayload } from '@aicp/queue-contracts';
import { buildQueueJobId } from '@api/common/queue/job-id.util';
import { isPhaseEnabled } from '@api/config/feature-flags';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { CONTENT_PIPELINE_QUEUE, SEO_GENERATE_JOB } from './constants/seo.constants';
import { SeoRepository } from './seo.repository';

@Injectable()
export class SeoService {
  constructor(
    private readonly repository: SeoRepository,
    @InjectQueue(CONTENT_PIPELINE_QUEUE)
    private readonly queue: Queue<SeoGenerateJobPayload>,
  ) {}

  async enqueue(topicId: string, dto: GenerateSeoDto, actorId: string) {
    if (!isPhaseEnabled(2)) {
      throw new ServiceUnavailableException('Phase 2 features are disabled');
    }

    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const jobId = buildQueueJobId('seo', 'topic', topicId, 'latest');
    const existingJob = await this.queue.getJob(jobId);
    if (existingJob) {
      return { enqueued: true, topicId, jobId: existingJob.id ?? jobId, idempotent: true };
    }

    const job = await this.queue.add(
      SEO_GENERATE_JOB,
      { topicId, requestedBy: actorId, traceId: dto.traceId },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
      },
    );

    return { enqueued: true, topicId, jobId: job.id ?? jobId };
  }

  async getLatest(topicId: string) {
    if (!isPhaseEnabled(2)) {
      throw new ServiceUnavailableException('Phase 2 features are disabled');
    }

    const artifact = await this.repository.latestSeo(topicId);
    if (!artifact) {
      throw new NotFoundException('SEO artifact not found');
    }

    return artifact;
  }
}
