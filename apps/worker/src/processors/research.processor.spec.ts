import { describe, expect, it } from 'vitest';
import { WorkerResearchProcessor } from './research.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerResearchProcessor', () => {
  it('returns null for non-research jobs', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerResearchProcessor(
      { run: async () => ({}) } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(createJob({ name: 'research.unknown' }) as any);

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('content.pipeline');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
