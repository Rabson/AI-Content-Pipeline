import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ContentState, PublicationChannel, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { Queue } from 'bullmq';
import { isPhaseEnabled } from '../../common/config/feature-flags';
import { WorkflowService } from '../workflow/workflow.service';
import { PUBLISHING_QUEUE, DEVTO_PUBLISH_JOB } from './constants/publisher.constants';
import { PublishDevtoDto } from './dto/publish-devto.dto';
import { PublisherOrchestrator } from './publisher.orchestrator';
import { PublisherRepository } from './publisher.repository';

@Injectable()
export class PublisherService {
  constructor(
    private readonly repository: PublisherRepository,
    private readonly orchestrator: PublisherOrchestrator,
    private readonly workflowService: WorkflowService,
    @InjectQueue(PUBLISHING_QUEUE)
    private readonly queue: Queue,
  ) {}

  listPublications(topicId: string) {
    return this.repository.listPublications(topicId);
  }

  async enqueueDevtoPublish(topicId: string, dto: PublishDevtoDto, actorId: string) {
    if (!isPhaseEnabled(2)) {
      throw new ServiceUnavailableException('Phase 2 features are disabled');
    }

    const topic = await this.getTopicOrThrow(topicId);
    const targetDraft = await this.getPublishableDraft(topicId, dto.draftVersionNumber);

    const pending = await this.repository.findPendingPublication(topicId, PublicationChannel.DEVTO);
    if (pending) {
      return this.idempotentResponse(topicId, pending.id);
    }

    await this.preparePublish(topicId, targetDraft.id, targetDraft.versionNumber, actorId);
    const publication = await this.repository.createPublicationShell({
      topicId,
      contentItemId: topic.contentItemId ?? undefined,
      draftVersionId: targetDraft.id,
      channel: PublicationChannel.DEVTO,
      title: this.orchestrator.buildPublicationTitle(topic.title),
      payload: {
        canonicalUrl: dto.canonicalUrl,
        tags: dto.tags ?? [],
        requestedBy: actorId,
        draftVersionNumber: targetDraft.versionNumber,
      },
    });

    const { job, jobId } = await this.enqueuePublishJob(topicId, publication.id, dto, actorId);
    const queuedJobId = job.id ?? jobId;
    await this.recordQueuedPublish(topicId, publication.id, queuedJobId, actorId);

    return {
      enqueued: true,
      topicId,
      publicationId: publication.id,
      jobId: queuedJobId,
    };
  }

  private async getTopicOrThrow(topicId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  private async getPublishableDraft(topicId: string, requestedVersion?: number) {
    const latestApprovedDraft = await this.repository.getLatestApprovedDraft(topicId);
    if (!latestApprovedDraft) {
      throw new BadRequestException('No approved draft version is available for publishing');
    }

    const targetDraft = requestedVersion
      ? await this.repository.getApprovedDraftByVersion(topicId, requestedVersion)
      : latestApprovedDraft;

    if (!targetDraft) {
      throw new BadRequestException('Requested approved draft version was not found');
    }

    if (targetDraft.versionNumber !== latestApprovedDraft.versionNumber) {
      throw new BadRequestException('Only the latest approved draft version can be published');
    }

    return targetDraft;
  }

  private idempotentResponse(topicId: string, publicationId: string) {
    return {
      enqueued: true,
      topicId,
      publicationId,
      idempotent: true,
    };
  }

  private async preparePublish(topicId: string, draftVersionId: string, versionNumber: number, actorId: string) {
    await this.workflowService.lockForPublish(topicId, draftVersionId, true);
    await this.workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.PUBLISH,
      toState: ContentState.PUBLISH_IN_PROGRESS,
      actorId,
      metadata: { draftVersionId, versionNumber },
      eventType: WorkflowEventType.PUBLISH_REQUESTED,
    });
  }

  private enqueuePublishJob(topicId: string, publicationId: string, dto: PublishDevtoDto, actorId: string) {
    const jobId = `publish:devto:${topicId}:${publicationId}`;
    return this.queue.add(
      DEVTO_PUBLISH_JOB,
      {
        publicationId,
        topicId,
        canonicalUrl: dto.canonicalUrl,
        tags: dto.tags ?? [],
        requestedBy: actorId,
      },
      {
        jobId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 60000 },
      },
    ).then((job) => ({ job, jobId }));
  }

  private async recordQueuedPublish(topicId: string, publicationId: string, jobId: string, actorId: string) {
    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.PUBLISH,
      eventType: WorkflowEventType.ENQUEUED,
      actorId,
      metadata: { publicationId, jobId },
    });
  }
}
