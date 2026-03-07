import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { AddSourceDto } from './dto/add-source.dto';
import { ResearchQueryDto } from './dto/research-query.dto';
import { RunResearchDto } from './dto/run-research.dto';
import { ResearchRepository } from './research.repository';
import { SourceNormalizerService } from './providers/source-normalizer.service';
import { CONTENT_PIPELINE_QUEUE, RESEARCH_RUN_JOB } from './constants/research.constants';
import { mapResearchArtifact } from './mappers/research.mapper';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class ResearchService {
  constructor(
    private readonly repository: ResearchRepository,
    private readonly sourceNormalizer: SourceNormalizerService,
    private readonly workflowService: WorkflowService,
    @InjectQueue(CONTENT_PIPELINE_QUEUE)
    private readonly contentPipelineQueue: Queue,
  ) {}

  async enqueue(topicId: string, dto: RunResearchDto, actorId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const jobId = `research:topic:${topicId}:v1`;
    const existingJob = await this.contentPipelineQueue.getJob(jobId);
    if (existingJob || topic.status === TopicStatus.RESEARCH_QUEUED || topic.status === TopicStatus.RESEARCH_IN_PROGRESS) {
      return {
        enqueued: true,
        topicId,
        jobId: existingJob?.id ?? jobId,
        idempotent: true,
      };
    }

    if (topic.status !== TopicStatus.APPROVED) {
      throw new BadRequestException('Topic must be approved before research can start');
    }

    this.workflowService.assertTopicTransition(topic.status, TopicStatus.RESEARCH_QUEUED);
    await this.repository.markTopicStatus(topicId, TopicStatus.RESEARCH_QUEUED);

    const job = await this.contentPipelineQueue.add(
      RESEARCH_RUN_JOB,
      {
        topicId,
        requestedBy: actorId,
        traceId: dto.traceId,
        sourceUrls: dto.sourceUrls ?? [],
      },
      {
        jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000,
        },
      },
    );

    return {
      enqueued: true,
      topicId,
      jobId: job.id ?? jobId,
    };
  }

  async getLatest(topicId: string, _query?: ResearchQueryDto) {
    const artifact = await this.repository.latestResearchByTopic(topicId);
    if (!artifact) {
      throw new NotFoundException('Research artifact not found');
    }

    return mapResearchArtifact(artifact);
  }

  async listVersions(topicId: string) {
    return this.repository.researchVersions(topicId);
  }

  async addManualSource(topicId: string, dto: AddSourceDto) {
    return this.repository.addManualSource(topicId, {
      url: dto.url,
      domain: this.sourceNormalizer.extractDomain(dto.url),
      title: dto.title,
      excerpt: dto.excerpt,
      sourceType: dto.sourceType ?? 'OTHER',
    });
  }
}
