import { describe, expect, it } from 'vitest';
import { WorkerRevisionProcessor } from './revision.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerRevisionProcessor', () => {
  it('returns null for unsupported revision jobs', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerRevisionProcessor(
      { processRevisionSection: async () => ({}), finalizeRevision: async () => ({}) } as any,
      { markRevisionRunFailed: async () => undefined } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(createJob({ name: 'revision.unknown' }) as any);

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('content.pipeline');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
