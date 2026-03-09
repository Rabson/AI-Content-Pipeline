import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OutlineController } from '@api/modules/outline/outline.controller';
import { OutlineService } from '@api/modules/outline/outline.service';
import { UserTopicOwnershipService } from '@api/modules/user/services/user-topic-ownership.service';

describe('OutlineController endpoint transport', () => {
  const enqueue = vi.fn().mockResolvedValue({ queued: true });

  afterEach(() => {
    enqueue.mockClear();
  });

  it('maps outline generate route and delegates to service', async () => {
    const controller = new OutlineController(
      { enqueue, getOutline: vi.fn() } as unknown as OutlineService,
      { assertTopicReadAccess: vi.fn() } as unknown as UserTopicOwnershipService,
    );

    const method = Reflect.get(controller, 'generate') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('generate');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);

    await controller.generate('topic-1', {} as never, { user: { id: 'editor-1' }, header: vi.fn() } as never);
    expect(enqueue).toHaveBeenCalled();
  });
});
