import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SeoController } from '@api/modules/seo/seo.controller';
import { SeoService } from '@api/modules/seo/seo.service';
import { UserTopicOwnershipService } from '@api/modules/user/services/user-topic-ownership.service';

describe('SeoController endpoint transport', () => {
  const enqueue = vi.fn().mockResolvedValue({ queued: true });

  afterEach(() => {
    enqueue.mockClear();
  });

  it('maps seo generate route and delegates to service', async () => {
    const controller = new SeoController(
      { enqueue, getLatest: vi.fn() } as unknown as SeoService,
      { assertTopicReadAccess: vi.fn() } as unknown as UserTopicOwnershipService,
    );

    const method = Reflect.get(controller, 'generate') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('generate');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);

    await controller.generate('topic-1', {} as never, { user: { id: 'editor-1' }, header: vi.fn() } as never);
    expect(enqueue).toHaveBeenCalled();
  });
});
