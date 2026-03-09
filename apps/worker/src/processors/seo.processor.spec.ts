import { describe, expect, it } from 'vitest';
import { WorkerSeoProcessor } from './seo.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerSeoProcessor', () => {
  it('returns null for unsupported seo jobs', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerSeoProcessor(
      { run: async () => ({}) } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(createJob({ name: 'seo.unknown' }) as any);

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('content.pipeline');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
