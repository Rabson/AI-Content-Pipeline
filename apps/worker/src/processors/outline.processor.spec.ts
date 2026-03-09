import { describe, expect, it } from 'vitest';
import { WorkerOutlineProcessor } from './outline.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerOutlineProcessor', () => {
  it('returns null for non-outline jobs', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerOutlineProcessor(
      { run: async () => ({}) } as any,
      { markFailed: async () => undefined } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(createJob({ name: 'outline.unknown' }) as any);

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('content.pipeline');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
