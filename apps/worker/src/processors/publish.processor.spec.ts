import { describe, expect, it } from 'vitest';
import { WorkerPublishProcessor } from './publish.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerPublishProcessor', () => {
  it('returns null for unsupported publish jobs', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerPublishProcessor(
      { publish: async () => ({}) } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(
      createJob({ queueName: 'publishing', name: 'publishing.unknown' }) as any,
    );

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('publishing');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
