import { describe, expect, it } from 'vitest';
import { WorkerDraftProcessor } from './draft.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerDraftProcessor', () => {
  it('returns null for unsupported draft jobs', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerDraftProcessor(
      { processSection: async () => ({}), finalizeDraft: async () => ({}) } as any,
      { markDraftFailed: async () => undefined } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(createJob({ name: 'draft.unknown' }) as any);

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('content.pipeline');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
