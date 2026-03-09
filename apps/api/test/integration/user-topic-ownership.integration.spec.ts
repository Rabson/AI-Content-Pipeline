import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AppRole } from '@api/common/auth/roles.enum';
import { UserTopicOwnershipService } from '@api/modules/user/services/user-topic-ownership.service';

describe('UserTopicOwnershipService authorization', () => {
  it('uses own-scope publish check for topic owner', async () => {
    const authorizationService = { assertPublish: vi.fn().mockResolvedValue(undefined) };
    const service = new UserTopicOwnershipService({} as any, {} as any, authorizationService as any);

    await service.assertPublishAccess({ id: 'user-1', role: AppRole.USER } as any, 'user-1');

    expect(authorizationService.assertPublish).toHaveBeenCalledWith(AppRole.USER, 'own');
  });

  it('rejects USER publish when topic is not assigned', async () => {
    const authorizationService = {
      assertPublish: vi.fn().mockRejectedValue(new ForbiddenException('Insufficient role')),
    };
    const service = new UserTopicOwnershipService({} as any, {} as any, authorizationService as any);

    await expect(
      service.assertPublishAccess({ id: 'user-1', role: AppRole.USER } as any, null),
    ).rejects.toThrow(ForbiddenException);
    expect(authorizationService.assertPublish).toHaveBeenCalledWith(AppRole.USER, 'any');
  });
});
