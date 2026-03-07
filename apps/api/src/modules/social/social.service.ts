import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ContentState, SocialPostStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { isPhaseEnabled } from '../../config/feature-flags';
import { WorkflowService } from '../workflow/workflow.service';
import { GenerateLinkedInDto } from './dto/generate-linkedin.dto';
import { UpdateSocialPostStatusDto } from './dto/update-social-post-status.dto';
import { SOCIAL_LINKEDIN_GENERATE_JOB, SOCIAL_QUEUE } from './constants/social.constants';
import { SocialRepository } from './social.repository';

@Injectable()
export class SocialService {
  constructor(
    private readonly repository: SocialRepository,
    private readonly workflowService: WorkflowService,
    @InjectQueue(SOCIAL_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueLinkedIn(topicId: string, dto: GenerateLinkedInDto, actorId: string) {
    if (!isPhaseEnabled(2)) {
      throw new ServiceUnavailableException('Phase 2 features are disabled');
    }

    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const jobId = `social:linkedin:${topicId}:latest`;
    const existingJob = await this.queue.getJob(jobId);
    if (existingJob) {
      return { enqueued: true, topicId, jobId: existingJob.id ?? jobId, idempotent: true };
    }

    const job = await this.queue.add(
      SOCIAL_LINKEDIN_GENERATE_JOB,
      {
        topicId,
        requestedBy: actorId,
        traceId: dto.traceId,
      },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
      },
    );

    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.SOCIAL,
      eventType: WorkflowEventType.ENQUEUED,
      actorId,
      metadata: { jobId: job.id ?? jobId, traceId: dto.traceId ?? null },
    });

    return { enqueued: true, topicId, jobId: job.id ?? jobId };
  }

  async getLatestLinkedIn(topicId: string) {
    if (!isPhaseEnabled(2)) {
      throw new ServiceUnavailableException('Phase 2 features are disabled');
    }

    const artifact = await this.repository.latestLinkedInDraft(topicId);
    if (!artifact) {
      throw new NotFoundException('LinkedIn draft not found');
    }

    return this.repository.toView(artifact);
  }

  async updateStatus(socialPostId: string, dto: UpdateSocialPostStatusDto, actorId: string) {
    if (!isPhaseEnabled(2)) {
      throw new ServiceUnavailableException('Phase 2 features are disabled');
    }

    const post = await this.repository.getSocialPostOrThrow(socialPostId);
    const updated = await this.repository.applyStatus(socialPostId, dto.status, dto.externalUrl);

    await this.workflowService.recordEvent({
      topicId: post.topicId,
      stage: WorkflowStage.SOCIAL,
      eventType: WorkflowEventType.SOCIAL_STATUS_CHANGED,
      actorId,
      metadata: {
        socialPostId,
        status: dto.status,
        note: dto.note ?? null,
        externalUrl: dto.externalUrl ?? null,
      },
    });

    const topic = await this.repository.findTopicById(post.topicId);
    if (
      dto.status === SocialPostStatus.POSTED &&
      topic?.contentItem &&
      (topic.contentItem.currentState === ContentState.PUBLISHED ||
        topic.contentItem.currentState === ContentState.DISTRIBUTION_IN_PROGRESS)
    ) {
      await this.workflowService.transitionContentState({
        topicId: post.topicId,
        stage: WorkflowStage.SOCIAL,
        toState: ContentState.COMPLETED,
        actorId,
        metadata: {
          socialPostId,
          externalUrl: dto.externalUrl ?? null,
        },
      });
    }

    return this.repository.toView(updated);
  }
}
