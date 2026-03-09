import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SystemController } from '@api/modules/system/system.controller';
import { SystemService } from '@api/modules/system/system.service';

describe('SystemController endpoint transport', () => {
  const health = vi.fn().mockResolvedValue({ status: 'ok' });

  afterEach(() => {
    health.mockClear();
  });

  it('maps health route and delegates to service', async () => {
    const controller = new SystemController({
      health,
      readiness: vi.fn().mockResolvedValue({ ready: true }),
    } as unknown as SystemService);

    const method = Reflect.get(controller, 'health') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('health');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.GET);

    await controller.health();
    expect(health).toHaveBeenCalled();
  });
});
