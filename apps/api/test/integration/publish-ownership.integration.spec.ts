import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AppRole } from '@api/common/auth/roles.enum';
import { CasbinAuthorizationService } from '@api/common/auth/casbin-authorization.service';
import { PublisherService } from '@api/modules/publisher/publisher.service';
import { UserTopicOwnershipService } from '@api/modules/user/services/user-topic-ownership.service';
import { PublicationChannel } from '@prisma/client';

function createPublisherService() {
  const repository = {
    findTopicById: vi.fn().mockResolvedValue({
      id: 'topic-1',
      ownerUserId: 'user-1',
      contentItemId: 'content-1',
      title: 'Topic title',
      owner: { id: 'user-1' },
    }),
    getLatestApprovedDraft: vi.fn().mockResolvedValue({ id: 'draft-1', versionNumber: 1 }),
    findPendingPublication: vi.fn().mockResolvedValue(null),
    createPublicationShell: vi.fn().mockResolvedValue({ id: 'publication-1' }),
  };
  const securityEventService = {
    publishRequested: vi.fn().mockResolvedValue(undefined),
    adminPublishOnBehalf: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new PublisherService(
      repository as any,
      { buildPublicationTitle: vi.fn((title: string) => title) } as any,
      { lockForPublish: vi.fn(), transitionContentState: vi.fn(), recordEvent: vi.fn() } as any,
      { assertTopicReadAccess: vi.fn(), assertPublishAccess: vi.fn().mockResolvedValue(undefined) } as any,
      securityEventService as any,
      { resolveCredential: vi.fn().mockResolvedValue({ accessToken: 'token', settings: {} }) } as any,
      { add: vi.fn().mockResolvedValue({ id: 'job-1' }) } as any,
    ),
    securityEventService,
  };
}

describe('Publish ownership integration', () => {
  it('blocks USER publish on content owned by someone else', async () => {
    const service = new UserTopicOwnershipService({} as any, {} as any, new CasbinAuthorizationService());
    await expect(
      service.assertPublishAccess({ id: 'user-1', role: AppRole.USER }, 'user-2'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('records admin-on-behalf event when ADMIN enqueues publication', async () => {
    const { service, securityEventService } = createPublisherService();

    await service.enqueuePublication(
      'topic-1',
      { channel: PublicationChannel.DEVTO, tags: [] },
      { id: 'admin-1', role: AppRole.ADMIN } as any,
    );

    expect(securityEventService.adminPublishOnBehalf).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 'admin-1', subjectUserId: 'user-1' }),
    );
  });

  it('requires any-scope permission when topic has no owner', async () => {
    const service = new UserTopicOwnershipService({} as any, {} as any, new CasbinAuthorizationService());

    await expect(
      service.assertPublishAccess({ id: 'user-1', role: AppRole.USER }, null),
    ).rejects.toThrow(ForbiddenException);
  });
});
