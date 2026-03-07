import { describe, expect, it, vi } from 'vitest';
import { WorkerOutlineProcessor } from '../../../../../worker/src/processors/outline.processor';

describe('OutlineProcessor', () => {
  it('processes outline.generate jobs via orchestrator', async () => {
    const processor = new WorkerOutlineProcessor(
      { run: vi.fn().mockResolvedValue({ id: 'outline-1' }) } as any,
      { markFailed: vi.fn() } as any,
      {
        start: vi.fn().mockResolvedValue({ id: 'exec-1' }),
        succeed: vi.fn(),
        fail: vi.fn(),
      } as any,
      {
        recordStart: vi.fn(),
        recordSuccess: vi.fn(),
        recordFailure: vi.fn(),
      } as any,
      { classify: vi.fn().mockReturnValue({ retryable: true, reason: 'retryable-transient-error' }) } as any,
    );

    const result = await processor.process({
      name: 'outline.generate',
      queueName: 'content.pipeline',
      data: { topicId: 'topic-1' },
    } as any);

    expect(result).toEqual({ id: 'outline-1' });
  });
});
