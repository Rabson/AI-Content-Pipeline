import { describe, expect, it, vi } from 'vitest';
import { WorkerRevisionProcessor } from '../../../../../worker/src/processors/revision.processor';

describe('RevisionProcessor', () => {
  it('processes revision apply section/finalize jobs', async () => {
    const orchestrator = {
      processRevisionSection: vi.fn().mockResolvedValue({ status: 'completed' }),
      finalizeRevision: vi.fn().mockResolvedValue({ status: 'finalized' }),
    } as any;
    const processor = new WorkerRevisionProcessor(
      orchestrator,
      { markRevisionRunFailed: vi.fn() } as any,
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

    const sectionResult = await processor.process({
      name: 'revision.apply.section',
      queueName: 'content.pipeline',
      data: { revisionRunId: 'rev-1' },
    } as any);
    const finalizeResult = await processor.process({
      name: 'revision.apply.finalize',
      queueName: 'content.pipeline',
      data: { revisionRunId: 'rev-1' },
    } as any);

    expect(sectionResult.status).toBe('completed');
    expect(finalizeResult.status).toBe('finalized');
  });
});
