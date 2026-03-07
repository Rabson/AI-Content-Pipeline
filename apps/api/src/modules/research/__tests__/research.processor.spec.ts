import { describe, expect, it, vi } from 'vitest';
import { WorkerResearchProcessor } from '../../../../../worker/src/processors/research.processor';

describe('ResearchProcessor', () => {
  it('processes research.run jobs via orchestrator', async () => {
    const processor = new WorkerResearchProcessor(
      { run: vi.fn().mockResolvedValue({ status: 'ready' }) } as any,
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
      name: 'research.run',
      queueName: 'content.pipeline',
      data: { topicId: 'topic-1', traceId: 'trace-1' },
    } as any);

    expect(result.status).toBe('ready');
  });
});
