import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SocialController } from '@api/modules/social/social.controller';
import { SocialService } from '@api/modules/social/social.service';
import { UserTopicOwnershipService } from '@api/modules/user/services/user-topic-ownership.service';

describe('SocialController endpoint transport', () => {
  const enqueueLinkedIn = vi.fn().mockResolvedValue({ queued: true });

  afterEach(() => {
    enqueueLinkedIn.mockClear();
  });

  it('maps social generate route and delegates to service', async () => {
    const controller = new SocialController(
      { enqueueLinkedIn, getLatestLinkedIn: vi.fn(), updateStatus: vi.fn() } as unknown as SocialService,
      { assertTopicReadAccess: vi.fn() } as unknown as UserTopicOwnershipService,
    );

    const method = Reflect.get(controller, 'generate') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('topics/:topicId/social/linkedin/generate');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);

    await controller.generate('topic-1', {} as never, { user: { id: 'editor-1' }, header: vi.fn() } as never);
    expect(enqueueLinkedIn).toHaveBeenCalled();
  });
});
