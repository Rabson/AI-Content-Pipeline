import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResearchController } from '@api/modules/research/research.controller';
import { ResearchService } from '@api/modules/research/research.service';
import { UserTopicOwnershipService } from '@api/modules/user/services/user-topic-ownership.service';

describe('ResearchController endpoint transport', () => {
  const enqueue = vi.fn().mockResolvedValue({ queued: true });

  afterEach(() => {
    enqueue.mockClear();
  });

  it('maps research run route and delegates to service', async () => {
    const controller = new ResearchController(
      { enqueue, getLatest: vi.fn(), listVersions: vi.fn(), addManualSource: vi.fn() } as unknown as ResearchService,
      { assertTopicReadAccess: vi.fn() } as unknown as UserTopicOwnershipService,
    );

    const method = Reflect.get(controller, 'run') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('run');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);

    await controller.run('topic-1', {} as never, { user: { id: 'editor-1' }, header: vi.fn() } as never);
    expect(enqueue).toHaveBeenCalled();
  });
});
