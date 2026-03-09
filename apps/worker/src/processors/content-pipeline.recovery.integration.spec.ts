import { describe, expect, it, vi } from 'vitest';
import { WorkerContentPipelineProcessor } from './content-pipeline.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerContentPipelineProcessor recovery flow', () => {
  it('marks outline workflow as failed when outline generation throws', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const outlineRepository = { markFailed: vi.fn().mockResolvedValue(undefined) };
    const processor = new WorkerContentPipelineProcessor(
      { runImport: async () => ({}) } as any,
      { run: async () => ({}) } as any,
      { run: vi.fn().mockRejectedValue(new Error('outline failed')) } as any,
      outlineRepository as any,
      { processSection: async () => ({}), finalizeDraft: async () => ({}) } as any,
      { markDraftFailed: async () => undefined } as any,
      { processRevisionSection: async () => ({}), finalizeRevision: async () => ({}) } as any,
      { markRevisionRunFailed: async () => undefined } as any,
      { run: async () => ({}) } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock(false, 'non-retryable-error') as any,
    );
    const job = createJob({
      name: 'outline.generate',
      data: { topicId: 'topic-1' },
    });

    await expect(processor.process(job as any)).rejects.toThrow('outline failed');

    expect(outlineRepository.markFailed).toHaveBeenCalledWith('topic-1', 'outline failed');
    expect(job.discard).toHaveBeenCalledTimes(1);
    expect(execution.fail).toHaveBeenCalledWith(
      'exec-1',
      expect.any(Error),
      'non-retryable-error',
    );
  });
});
