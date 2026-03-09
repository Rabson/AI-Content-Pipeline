import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  withQueueContractEnvelope,
  type OutlineGenerateJobPayload,
} from '@aicp/queue-contracts';
import { buildQueueJobId } from '@api/common/queue/job-id.util';
import { resolveQueueTraceMetadata } from '@api/common/queue/trace-metadata.util';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GetOutlineQueryDto } from './dto/get-outline-query.dto';
import { CONTENT_PIPELINE_QUEUE, OUTLINE_GENERATE_JOB } from './constants/outline.constants';
import { OutlineRepository } from './outline.repository';

@Injectable()
export class OutlineService {
  constructor(
    private readonly repository: OutlineRepository,
    @InjectQueue(CONTENT_PIPELINE_QUEUE)
    private readonly contentPipelineQueue: Queue<OutlineGenerateJobPayload>,
  ) {}

  async enqueue(topicId: string, dto: GenerateOutlineDto, actorId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const jobId = buildQueueJobId('outline', 'topic', topicId, 'latest');
    const trace = resolveQueueTraceMetadata({ traceId: dto.traceId });
    const existingJob = await this.contentPipelineQueue.getJob(jobId);
    if (existingJob) {
      return {
        enqueued: true,
        topicId,
        jobId: existingJob.id ?? jobId,
        idempotent: true,
      };
    }

    const job = await this.contentPipelineQueue.add(
      OUTLINE_GENERATE_JOB,
      withQueueContractEnvelope(
        {
          topicId,
          requestedBy: actorId,
          traceId: dto.traceId,
        },
        { idempotencyKey: jobId, ...trace },
      ),
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
      },
    );

    return {
      enqueued: true,
      topicId,
      jobId: job.id ?? jobId,
    };
  }

  async getOutline(topicId: string, query: GetOutlineQueryDto) {
    const outline = query.version
      ? await this.repository.outlineByVersion(topicId, query.version)
      : await this.repository.latestOutline(topicId);

    if (!outline) {
      throw new NotFoundException('Outline not found');
    }

    return outline;
  }
}
