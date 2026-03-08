import { Injectable } from '@nestjs/common';
import { ContentState, PublicationChannel, PublicationStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { WorkflowService } from '../workflow/workflow.service';
import { UserPublisherTokenResolverService } from '../user/services/user-publisher-token-resolver.service';
import { PublicationVerifierService } from './providers/publication-verifier.service';
import { PublisherRegistryService } from './providers/publisher-registry.service';
import { PublisherRepository } from './publisher.repository';

@Injectable()
export class PublisherOrchestrator {
  constructor(
    private readonly repository: PublisherRepository,
    private readonly registry: PublisherRegistryService,
    private readonly verifier: PublicationVerifierService,
    private readonly workflowService: WorkflowService,
    private readonly credentialResolver: UserPublisherTokenResolverService,
  ) {}

  async publish(params: {
    publicationId: string;
    topicId: string;
    canonicalUrl?: string;
    tags?: string[];
  }) {
    const publication = await this.repository.getPublicationOrThrow(params.publicationId);
    const draft = publication.draftVersion;

    if (!draft?.assembledMarkdown) {
      throw new Error('No pinned markdown draft available for publishing');
    }

    const adapter = this.registry.get(publication.channel);
    const requestPayload = {
      title: publication.title,
      markdown: draft.assembledMarkdown,
      canonicalUrl: params.canonicalUrl,
      tags: params.tags,
    };
    const credential = await this.resolveCredential(publication.channel, publication.publisherUserId);

    try {
      const response = await adapter.publish(requestPayload, credential);
      return this.completePublish(params.topicId, params.publicationId, draft.id, publication.channel, requestPayload, response);
    } catch (error) {
      await this.failPublish(params.topicId, params.publicationId, requestPayload, error);
      throw error;
    }
  }

  buildPublicationTitle(topicTitle: string) {
    return topicTitle;
  }

  private async resolveCredential(channel: PublicationChannel, publisherUserId?: string | null) {
    if (publisherUserId) {
      const accessToken = await this.credentialResolver.resolveToken(publisherUserId, channel);
      if (accessToken) {
        return { accessToken };
      }
    }

    return undefined;
  }

  private async completePublish(
    topicId: string,
    publicationId: string,
    draftVersionId: string,
    channel: PublicationChannel,
    requestPayload: Record<string, unknown>,
    response: { externalId: string; url: string; raw: unknown },
  ) {
    await this.repository.recordAttempt({
      publicationId,
      status: PublicationStatus.PUBLISHED,
      requestPayload,
      responsePayload: response.raw as Record<string, unknown>,
    });

    const verification = await this.verifier.verify(channel, response.url);
    const updated = await this.repository.markPublished({
      publicationId,
      externalId: response.externalId,
      externalUrl: response.url,
      verificationStatus: verification.ok ? 'verified' : 'unverified',
    });

    await this.workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.PUBLISH,
      toState: ContentState.PUBLISHED,
      metadata: { publicationId, externalUrl: response.url },
      eventType: WorkflowEventType.PUBLISHED,
    });
    await this.workflowService.lockForPublish(topicId, draftVersionId, false);

    return updated;
  }

  private async failPublish(
    topicId: string,
    publicationId: string,
    requestPayload: Record<string, unknown>,
    error: unknown,
  ) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    await this.repository.recordAttempt({
      publicationId,
      status: PublicationStatus.FAILED,
      requestPayload,
      error: message,
    });
    await this.repository.markFailed(publicationId, message);
    await this.workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.PUBLISH,
      toState: ContentState.FAILED,
      metadata: { publicationId, error: message },
      eventType: WorkflowEventType.PUBLISH_FAILED,
    });
  }
}
