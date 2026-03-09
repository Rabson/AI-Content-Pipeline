import { describe, expect, it } from 'vitest';
import { WorkerAnalyticsProcessor } from './analytics.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerAnalyticsProcessor', () => {
  it('returns null for non-rollup jobs and records success', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerAnalyticsProcessor(
      { runDailyRollup: async () => ({}) } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(
      createJob({ queueName: 'analytics', name: 'analytics.unknown' }) as any,
    );

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('analytics');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
