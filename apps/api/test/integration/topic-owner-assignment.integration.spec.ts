import { describe, expect, it, vi } from 'vitest';
import { TopicPublishCommandService } from '@api/modules/topic/services/topic-publish-command.service';

describe('Topic owner assignment integration', () => {
  it('reassigns topic owner and records workflow event', async () => {
    const repository = {
      assignOwner: vi.fn().mockResolvedValue({ id: 'topic-1', ownerUserId: 'user-2' }),
    };
    const topicQueryService = {
      getTopic: vi.fn().mockResolvedValue({ id: 'topic-1' }),
    };
    const workflowService = {
      recordEvent: vi.fn().mockResolvedValue(undefined),
    };
    const userAccountService = {
      getUser: vi.fn().mockResolvedValue({ id: 'user-2' }),
    };

    const service = new TopicPublishCommandService(
      repository as any,
      topicQueryService as any,
      workflowService as any,
      userAccountService as any,
    );

    const updated = await service.assignOwner('topic-1', 'user-2', 'admin-1');

    expect(topicQueryService.getTopic).toHaveBeenCalledWith('topic-1');
    expect(userAccountService.getUser).toHaveBeenCalledWith('user-2');
    expect(repository.assignOwner).toHaveBeenCalledWith('topic-1', 'user-2');
    expect(workflowService.recordEvent).toHaveBeenCalled();
    expect(updated.ownerUserId).toBe('user-2');
  });
});
