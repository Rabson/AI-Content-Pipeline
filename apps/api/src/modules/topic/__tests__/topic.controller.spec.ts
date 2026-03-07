import { describe, expect, it, vi } from 'vitest';
import { TopicController } from '../topic.controller';

describe('TopicController', () => {
  it('maps create route to the service with actor context', async () => {
    const topicService = {
      createTopic: vi.fn().mockResolvedValue({ id: 'topic-1' }),
    } as any;
    const controller = new TopicController(topicService);
    const request = {
      user: { id: 'editor-1' },
      header: vi.fn(),
    } as any;

    await controller.create({ title: 'Topic' } as any, request);

    expect(topicService.createTopic).toHaveBeenCalledWith({ title: 'Topic' }, 'editor-1');
  });
});
