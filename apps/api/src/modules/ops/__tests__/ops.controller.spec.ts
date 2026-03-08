import { SecurityEventType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { OpsController } from '../ops.controller';

describe('OpsController', () => {
  function createController() {
    const opsService = {
      listSecurityEvents: vi.fn().mockResolvedValue([]),
      listFailedPublications: vi.fn().mockResolvedValue([]),
      retryFailedPublication: vi.fn().mockResolvedValue({ requeued: true }),
    };
    const rateLimitService = { enforce: vi.fn().mockResolvedValue(undefined) };
    return { controller: new OpsController(opsService as any, rateLimitService as any), opsService, rateLimitService };
  }

  it('lists security events with the requested filters', async () => {
    const { controller, opsService } = createController();
    await controller.securityEvents('5', SecurityEventType.LOGIN_FAILED);
    expect(opsService.listSecurityEvents).toHaveBeenCalledWith(5, SecurityEventType.LOGIN_FAILED);
  });

  it('lists failed publications with the requested limit', async () => {
    const { controller, opsService } = createController();
    await controller.publicationFailures('10');
    expect(opsService.listFailedPublications).toHaveBeenCalledWith(10);
  });

  it('retries a failed publication using the authenticated actor', async () => {
    const { controller, opsService, rateLimitService } = createController();
    const request = { ip: '127.0.0.1', user: { id: 'admin-1', role: 'ADMIN' } } as any;

    await controller.retryPublication('publication-1', request);

    expect(rateLimitService.enforce).toHaveBeenCalled();
    expect(opsService.retryFailedPublication).toHaveBeenCalledWith('publication-1', request.user);
  });
});
