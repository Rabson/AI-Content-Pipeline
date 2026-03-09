import { describe, expect, it } from 'vitest';
import { WorkerSocialProcessor } from './social.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerSocialProcessor', () => {
  it('returns null for unsupported social jobs', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerSocialProcessor(
      { runLinkedIn: async () => ({}) } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(
      createJob({ queueName: 'social', name: 'social.unknown' }) as any,
    );

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('social');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
