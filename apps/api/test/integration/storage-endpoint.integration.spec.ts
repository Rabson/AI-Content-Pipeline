import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StorageController } from '@api/modules/storage/storage.controller';
import { StorageService } from '@api/modules/storage/storage.service';
import { RequestRateLimitService } from '@api/common/security/request-rate-limit.service';

describe('StorageController endpoint transport', () => {
  const listTopicAssets = vi.fn().mockResolvedValue([]);

  afterEach(() => {
    listTopicAssets.mockClear();
  });

  it('maps storage list route and delegates to service', async () => {
    const controller = new StorageController(
      { listTopicAssets, createUploadUrl: vi.fn() } as unknown as StorageService,
      { enforce: vi.fn() } as unknown as RequestRateLimitService,
    );

    const method = Reflect.get(controller, 'list') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('/');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.GET);

    await controller.list('topic-1', { user: { id: 'user-1' } } as never);
    expect(listTopicAssets).toHaveBeenCalled();
  });
});
