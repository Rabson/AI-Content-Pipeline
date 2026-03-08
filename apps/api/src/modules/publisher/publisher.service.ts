import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ContentState, PublicationChannel, PublicationStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { Queue } from 'bullmq';
import type { PublishArticleJobPayload } from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { AuthenticatedUser } from '@api/common/interfaces/authenticated-request.interface';
import { buildQueueJobId } from '@api/common/queue/job-id.util';
import { SecurityEventService } from '@api/common/security/security-event.service';
import { isPhaseEnabled } from '@api/config/feature-flags';
import { UserPublisherTokenResolverService } from '../user/services/user-publisher-token-resolver.service';
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
    private readonly credentialResolver: UserPublisherTokenResolverService,
    @InjectQueue(PUBLISHING_QUEUE) private readonly queue: Queue<PublishArticleJobPayload>,
  ) {}

  async listPublications(topicId: string, actor?: AuthenticatedUser) {
    await this.ownershipService.assertTopicReadAccess(actor, topicId);
    return this.repository.listPublications(topicId);
  }

  async getPublicationOptions(topicId: string, actor: AuthenticatedUser) {
    const topic = await this.getTopicOrThrow(topicId);
    await this.ownershipService.assertPublishAccess(actor, topic.ownerUserId ?? null);

    const targetUserId = topic.ownerUserId ?? actor.id;
    const channels = await Promise.all(
      Object.values(PublicationChannel).map((channel) =>
        this.buildChannelOption(channel, targetUserId),
      ),
    );

    return {
      topicId,
      owner: topic.owner ?? null,
      publishAsUserId: targetUserId,
      canReassignOwner: actor.role === AppRole.ADMIN,
      channels,
    };
  }

  async enqueuePublication(topicId: string, dto: RequestPublicationDto, actor: AuthenticatedUser) {
    if (!isPhaseEnabled(2)) throw new ServiceUnavailableException('Phase 2 features are disabled');
    const topic = await this.getTopicOrThrow(topicId);
    await this.ownershipService.assertPublishAccess(actor, topic.ownerUserId ?? null);
    await this.securityEventService.publishRequested({
      actorUserId: actor.id,
      subjectUserId: topic.ownerUserId ?? actor.id,
      resourceType: 'topic',
      resourceId: topicId,
      topicId,
      channel: dto.channel,
    });
    if (actor.role === AppRole.ADMIN && topic.ownerUserId && actor.id !== topic.ownerUserId) {
      await this.securityEventService.adminPublishOnBehalf({
        actorUserId: actor.id,
        subjectUserId: topic.ownerUserId,
        resourceType: 'topic',
        resourceId: topicId,
        topicId,
        channel: dto.channel,
      });
    }
    const draft = await this.getPublishableDraft(topicId, dto.draftVersionNumber);
    const channelOption = await this.buildChannelOption(dto.channel, topic.ownerUserId ?? actor.id);
    this.assertChannelReady(dto.channel, channelOption);
    const publisherUserId = channelOption.publisherUserId;
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

  async retryPublication(topicId: string, publicationId: string, actor: AuthenticatedUser) {
    const publication = await this.getPublicationForRetry(topicId, publicationId, actor);
    const payload = this.readPayload(publication.payloadJson);
    const draftVersion = publication.draftVersion;
    if (!draftVersion) throw new BadRequestException('Retry requires a pinned draft version');

    await this.preparePublish(topicId, draftVersion.id, draftVersion.versionNumber, actor.id);
    await this.repository.markRetryRequested(publicationId);
    const jobId = await this.enqueuePublishJob(
      topicId,
      publicationId,
      {
        channel: publication.channel,
        canonicalUrl: payload.canonicalUrl,
        tags: payload.tags,
        draftVersionNumber: draftVersion.versionNumber,
      },
      actor.id,
    );

    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.PUBLISH,
      eventType: WorkflowEventType.ENQUEUED,
      actorId: actor.id,
      metadata: { publicationId, jobId, retry: true, channel: publication.channel },
    });

    return { requeued: true, publicationId, topicId, jobId };
  }

  async retryPublicationById(publicationId: string, actor: AuthenticatedUser) {
    const publication = await this.repository.getPublicationOrThrow(publicationId);
    return this.retryPublication(publication.topicId, publicationId, actor);
  }

  listFailedPublications(limit = 20) {
    return this.repository.listFailedPublications(limit);
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

  private async buildChannelOption(channel: PublicationChannel, publisherUserId: string) {
    const credential = await this.credentialResolver.resolveCredential(publisherUserId, channel);
    const missingRequirements = this.missingRequirements(channel, credential?.settings, credential?.accessToken);

    return {
      channel,
      supported: true,
      publisherUserId,
      configured: Boolean(credential?.accessToken),
      ready: missingRequirements.length === 0,
      missingRequirements,
    };
  }

  private missingRequirements(
    channel: PublicationChannel,
    settings: { linkedinAuthorUrn?: string | null } | undefined,
    accessToken?: string,
  ) {
    const missing = accessToken ? [] : ['token'];
    if (channel === PublicationChannel.LINKEDIN && !settings?.linkedinAuthorUrn) {
      missing.push('linkedinAuthorUrn');
    }
    return missing;
  }

  private assertChannelReady(
    channel: PublicationChannel,
    option: { ready: boolean; missingRequirements: string[] },
  ) {
    if (option.ready) return;
    const requirements = option.missingRequirements.join(', ');
    throw new BadRequestException(`${channel} publishing is not ready: missing ${requirements}`);
  }

  private async getPublicationForRetry(
    topicId: string,
    publicationId: string,
    actor: AuthenticatedUser,
  ) {
    const publication = await this.repository.findPublicationById(topicId, publicationId);
    if (!publication) throw new NotFoundException('Publication not found');
    await this.ownershipService.assertPublishAccess(actor, publication.topic.ownerUserId ?? null);
    if (publication.status !== PublicationStatus.FAILED) {
      throw new BadRequestException('Only failed publications can be retried');
    }
    return publication;
  }

  private readPayload(payloadJson: unknown) {
    if (!payloadJson || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
      return { canonicalUrl: undefined, tags: [] as string[] };
    }

    const payload = payloadJson as Record<string, unknown>;
    const tags = Array.isArray(payload.tags)
      ? payload.tags.filter((tag): tag is string => typeof tag === 'string')
      : [];

    return {
      canonicalUrl: typeof payload.canonicalUrl === 'string' ? payload.canonicalUrl : undefined,
      tags,
    };
  }
}
