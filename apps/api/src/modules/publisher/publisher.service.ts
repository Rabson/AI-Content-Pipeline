import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ContentState, PublicationChannel, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { Queue } from 'bullmq';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { buildQueueJobId } from '../../common/queue/job-id.util';
import { SecurityEventService } from '../../common/security/security-event.service';
import { isPhaseEnabled } from '../../config/feature-flags';
import { UserTopicOwnershipService } from '../user/services/user-topic-ownership.service';
import { WorkflowService } from '../workflow/workflow.service';
import { PUBLISH_ARTICLE_JOB, PUBLISHING_QUEUE } from './constants/publisher.constants';
import { RequestPublicationDto } from './dto/request-publication.dto';
import { PublisherOrchestrator } from './publisher.orchestrator';
import { PublisherRepository } from './publisher.repository';

@Injectable()
export class PublisherService {
  constructor(
    private readonly repository: PublisherRepository,
    private readonly orchestrator: PublisherOrchestrator,
    private readonly workflowService: WorkflowService,
    private readonly ownershipService: UserTopicOwnershipService,
    private readonly securityEventService: SecurityEventService,
    @InjectQueue(PUBLISHING_QUEUE) private readonly queue: Queue,
  ) {}

  async listPublications(topicId: string, actor?: AuthenticatedUser) {
    await this.ownershipService.assertTopicReadAccess(actor, topicId);
    return this.repository.listPublications(topicId);
  }

  async enqueuePublication(topicId: string, dto: RequestPublicationDto, actor: AuthenticatedUser) {
    this.securityEventService.publishRequested({ topicId, actorId: actor.id, channel: dto.channel });
    if (!isPhaseEnabled(2)) throw new ServiceUnavailableException('Phase 2 features are disabled');
    if (dto.channel !== PublicationChannel.DEVTO) {
      throw new ServiceUnavailableException(`${dto.channel} publishing is not implemented yet`);
    }
    const topic = await this.getTopicOrThrow(topicId);
    await this.ownershipService.assertPublishAccess(actor, topic.ownerUserId ?? null);
    const draft = await this.getPublishableDraft(topicId, dto.draftVersionNumber);
    const publisherUserId = topic.ownerUserId ?? actor.id;
    const pending = await this.repository.findPendingPublication(topicId, dto.channel, publisherUserId);
    if (pending) return { enqueued: true, topicId, publicationId: pending.id, idempotent: true };
    await this.preparePublish(topicId, draft.id, draft.versionNumber, actor.id);
    const publication = await this.repository.createPublicationShell({
      topicId,
      contentItemId: topic.contentItemId ?? undefined,
      draftVersionId: draft.id,
      channel: dto.channel,
      requestedByUserId: actor.id,
      publisherUserId,
      title: this.orchestrator.buildPublicationTitle(topic.title),
      payload: { canonicalUrl: dto.canonicalUrl, tags: dto.tags ?? [], draftVersionNumber: draft.versionNumber },
    });
    const jobId = await this.enqueuePublishJob(topicId, publication.id, dto, actor.id);
    await this.workflowService.recordEvent({ topicId, stage: WorkflowStage.PUBLISH, eventType: WorkflowEventType.ENQUEUED, actorId: actor.id, metadata: { publicationId: publication.id, jobId, channel: dto.channel } });
    return { enqueued: true, topicId, publicationId: publication.id, jobId };
  }

  private async getTopicOrThrow(topicId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  private async getPublishableDraft(topicId: string, requestedVersion?: number) {
    const latest = await this.repository.getLatestApprovedDraft(topicId);
    if (!latest) throw new BadRequestException('No approved draft version is available for publishing');
    const target = requestedVersion ? await this.repository.getApprovedDraftByVersion(topicId, requestedVersion) : latest;
    if (!target) throw new BadRequestException('Requested approved draft version was not found');
    if (target.versionNumber !== latest.versionNumber) throw new BadRequestException('Only the latest approved draft version can be published');
    return target;
  }

  private async preparePublish(topicId: string, draftVersionId: string, versionNumber: number, actorId: string) {
    await this.workflowService.lockForPublish(topicId, draftVersionId, true);
    await this.workflowService.transitionContentState({ topicId, stage: WorkflowStage.PUBLISH, toState: ContentState.PUBLISH_IN_PROGRESS, actorId, metadata: { draftVersionId, versionNumber }, eventType: WorkflowEventType.PUBLISH_REQUESTED });
  }

  private async enqueuePublishJob(topicId: string, publicationId: string, dto: RequestPublicationDto, actorId: string) {
    const jobId = buildQueueJobId('publish', dto.channel.toLowerCase(), topicId, publicationId);
    const job = await this.queue.add(PUBLISH_ARTICLE_JOB, { publicationId, topicId, channel: dto.channel, canonicalUrl: dto.canonicalUrl, tags: dto.tags ?? [], requestedBy: actorId }, { jobId, attempts: 5, backoff: { type: 'exponential', delay: 60000 } });
    return job.id ?? jobId;
  }
}
