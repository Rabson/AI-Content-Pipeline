import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DraftController } from '@api/modules/draft/draft.controller';
import { DraftService } from '@api/modules/draft/draft.service';
import { UserTopicOwnershipService } from '@api/modules/user/services/user-topic-ownership.service';

describe('DraftController endpoint transport', () => {
  const enqueueDraftGeneration = vi.fn().mockResolvedValue({ draftVersionId: 'draft-1' });

  afterEach(() => {
    enqueueDraftGeneration.mockClear();
  });

  it('maps draft generate route and delegates to service', async () => {
    const controller = new DraftController(
      { enqueueDraftGeneration } as unknown as DraftService,
      { assertTopicReadAccess: vi.fn(), assertPublishAccess: vi.fn() } as unknown as UserTopicOwnershipService,
    );

    const method = Reflect.get(controller, 'generateDraft') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('topics/:topicId/drafts/generate');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);

    await controller.generateDraft('topic-1', { styleProfile: 'technical' } as never, { user: { id: 'editor-1' }, header: vi.fn() } as never);
    expect(enqueueDraftGeneration).toHaveBeenCalled();
  });
});
