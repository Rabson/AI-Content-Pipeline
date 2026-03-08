import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AppRole } from '../../../common/auth/roles.enum';
import { CasbinAuthorizationService } from '../../../common/auth/casbin-authorization.service';
import { TopicQueryService } from '../services/topic-query.service';
import { UserTopicOwnershipService } from '../../user/services/user-topic-ownership.service';

describe('topic access', () => {
  it('filters topic lists to the owner for USER role', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new TopicQueryService({ findMany } as any);

    await service.listTopics({ page: 1, limit: 20 } as any, { id: 'user-1', role: AppRole.USER });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: 'user-1' }));
  });

  it('does not filter topic lists for ADMIN role', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new TopicQueryService({ findMany } as any);

    await service.listTopics({ page: 1, limit: 20 } as any, { id: 'admin-1', role: AppRole.ADMIN });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: undefined }));
  });

  it('allows admin publish on behalf of the owner', async () => {
    const service = new UserTopicOwnershipService({} as any, {} as any, new CasbinAuthorizationService());
    await expect(service.assertPublishAccess({ id: 'admin-1', role: AppRole.ADMIN }, 'user-1')).resolves.toBeUndefined();
  });

  it('blocks user publish on unassigned content', async () => {
    const service = new UserTopicOwnershipService({} as any, {} as any, new CasbinAuthorizationService());
    await expect(service.assertPublishAccess({ id: 'user-1', role: AppRole.USER }, 'user-2')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
