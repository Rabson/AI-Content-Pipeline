import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiscoveryController } from '@api/modules/discovery/discovery.controller';
import { DiscoveryService } from '@api/modules/discovery/discovery.service';

describe('DiscoveryController endpoint transport', () => {
  const enqueueImport = vi.fn().mockResolvedValue({ status: 'queued' });

  afterEach(() => {
    enqueueImport.mockClear();
  });

  it('maps import route and delegates to service', async () => {
    const controller = new DiscoveryController({
      suggest: vi.fn(),
      listCandidates: vi.fn(),
      createManualCandidate: vi.fn(),
      enqueueImport,
    } as unknown as DiscoveryService);

    const method = Reflect.get(controller, 'importTopics') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('topics/import');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);

    await controller.importTopics({ provider: 'hacker_news' } as never, { user: { id: 'editor-1' }, header: vi.fn() } as never);
    expect(enqueueImport).toHaveBeenCalled();
  });
});
