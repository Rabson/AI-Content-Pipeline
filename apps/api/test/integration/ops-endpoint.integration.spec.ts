import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpsController } from '@api/modules/ops/ops.controller';
import { OpsService } from '@api/modules/ops/ops.service';
import { RequestRateLimitService } from '@api/common/security/request-rate-limit.service';

describe('OpsController endpoint transport', () => {
  const runtimeStatus = vi.fn().mockResolvedValue({ api: { ok: true }, worker: { ok: true } });

  afterEach(() => {
    runtimeStatus.mockClear();
  });

  it('maps runtime status route and delegates to service', async () => {
    const controller = new OpsController(
      {
        runtimeStatus,
        queueMetrics: vi.fn(),
        listFailedExecutions: vi.fn(),
        listSecurityEvents: vi.fn(),
        listFailedPublications: vi.fn(),
        replayExecution: vi.fn(),
        retryFailedPublication: vi.fn(),
      } as unknown as OpsService,
      { enforce: vi.fn() } as unknown as RequestRateLimitService,
    );

    const method = Reflect.get(controller, 'runtimeStatus') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('runtime-status');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.GET);

    await controller.runtimeStatus();
    expect(runtimeStatus).toHaveBeenCalled();
  });
});
