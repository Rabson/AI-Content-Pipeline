import { describe, expect, it, vi } from 'vitest';
import { OutlineService } from '../outline.service';

describe('OutlineService', () => {
  it('enqueues outline generation jobs', async () => {
    const queue = {
      getJob: vi.fn().mockResolvedValue(null),
      add: vi.fn().mockResolvedValue({ id: 'outline:job:1' }),
    } as any;
    const repository = {
      findTopicById: vi.fn().mockResolvedValue({ id: 'topic-1', title: 'Topic' }),
    } as any;

    const service = new OutlineService(repository, queue);
    const result = await service.enqueue('topic-1', { traceId: 'trace-1' }, 'editor-1');

    expect(result.enqueued).toBe(true);
    expect(queue.add).toHaveBeenCalledWith(
      'outline.generate',
      expect.objectContaining({ topicId: 'topic-1' }),
      expect.objectContaining({ jobId: 'outline__topic__topic-1__latest' }),
    );
  });
});
