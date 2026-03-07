import { describe, expect, it, vi } from 'vitest';
import { WorkerDraftProcessor } from '../../../../../worker/src/processors/draft.processor';

describe('DraftProcessor', () => {
  it('handles section and finalize jobs', async () => {
    const orchestrator = {
      processSection: vi.fn().mockResolvedValue({ status: 'generated' }),
      finalizeDraft: vi.fn().mockResolvedValue({ status: 'finalized' }),
    } as any;
    const processor = new WorkerDraftProcessor(
      orchestrator,
      { markDraftFailed: vi.fn() } as any,
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
      name: 'draft.generate.section',
      queueName: 'content.pipeline',
      data: { draftVersionId: 'draft-1' },
    } as any);
    const finalizeResult = await processor.process({
      name: 'draft.generate.finalize',
      queueName: 'content.pipeline',
      data: { draftVersionId: 'draft-1' },
    } as any);

    expect(sectionResult.status).toBe('generated');
    expect(finalizeResult.status).toBe('finalized');
  });
});
