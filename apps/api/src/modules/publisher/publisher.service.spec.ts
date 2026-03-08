import { BadRequestException } from '@nestjs/common';
import { PublicationChannel, PublicationStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AppRole } from '@api/common/auth/roles.enum';
import { PublisherService } from './publisher.service';

function createService() {
  const repository = {
    findPublicationById: vi.fn(),
    getPublicationOrThrow: vi.fn(),
    markRetryRequested: vi.fn().mockResolvedValue(undefined),
  };
  const orchestrator = { buildPublicationTitle: vi.fn((title: string) => title) };
  const workflowService = {
    lockForPublish: vi.fn().mockResolvedValue(undefined),
    transitionContentState: vi.fn().mockResolvedValue(undefined),
    recordEvent: vi.fn().mockResolvedValue(undefined),
  };
  const ownershipService = {
    assertTopicReadAccess: vi.fn().mockResolvedValue(undefined),
    assertPublishAccess: vi.fn().mockResolvedValue(undefined),
  };
  const securityEventService = {
    publishRequested: vi.fn().mockResolvedValue(undefined),
    adminPublishOnBehalf: vi.fn().mockResolvedValue(undefined),
  };
  const credentialResolver = { resolveCredential: vi.fn() };
  const queue = { add: vi.fn().mockResolvedValue({ id: 'job-1' }) };
  return {
    service: new PublisherService(
      repository as any,
      orchestrator as any,
      workflowService as any,
      ownershipService as any,
      securityEventService as any,
      credentialResolver as any,
      queue as any,
    ),
    repository,
    workflowService,
    ownershipService,
    queue,
  };
}

describe('PublisherService retryPublication', () => {
  it('rejects retry when the publication is not failed', async () => {
    const { service, repository } = createService();
    repository.findPublicationById.mockResolvedValue({
      id: 'publication-1',
      status: PublicationStatus.PUBLISHED,
      topic: { ownerUserId: 'user-1' },
    });
    await expect(service.retryPublication('topic-1', 'publication-1', { id: 'user-1', role: AppRole.USER } as any)).rejects.toThrow(BadRequestException);
  });

  it('rejects retry when the failed publication has no pinned draft version', async () => {
    const { service, repository } = createService();
    repository.findPublicationById.mockResolvedValue({
      id: 'publication-1',
      topic: { ownerUserId: 'user-1' },
      status: PublicationStatus.FAILED,
      channel: PublicationChannel.DEVTO,
      draftVersion: null,
      payloadJson: {},
    });

    await expect(
      service.retryPublication('topic-1', 'publication-1', { id: 'user-1', role: AppRole.USER } as any),
    ).rejects.toThrow('Retry requires a pinned draft version');
  });

  it('requeues a failed publication with its pinned draft version', async () => {
    const { service, repository, workflowService, queue } = createService();
    repository.findPublicationById.mockResolvedValue({
      id: 'publication-1',
      topic: { ownerUserId: 'user-1' },
      status: PublicationStatus.FAILED,
      channel: PublicationChannel.MEDIUM,
      draftVersion: { id: 'draft-1', versionNumber: 3 },
      payloadJson: { canonicalUrl: 'https://example.com/post', tags: ['node'] },
    });

    const result = await service.retryPublication(
      'topic-1',
      'publication-1',
      { id: 'user-1', role: AppRole.USER } as any,
    );

    expect(repository.markRetryRequested).toHaveBeenCalledWith('publication-1');
    expect(queue.add).toHaveBeenCalled();
    expect(workflowService.transitionContentState).toHaveBeenCalledWith(
      expect.objectContaining({ topicId: 'topic-1', toState: 'PUBLISH_IN_PROGRESS' }),
    );
    expect(result).toEqual(expect.objectContaining({ requeued: true, publicationId: 'publication-1' }));
  });
});
