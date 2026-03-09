import { describe, expect, it, vi } from 'vitest';
import { WorkerDiscoveryProcessor } from './discovery.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerDiscoveryProcessor integration flow', () => {
  it('discards and records failure for non-retryable errors', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const retryPolicy = createRetryPolicyMock(false, 'non-retryable-error');
    const processor = new WorkerDiscoveryProcessor(
      { runImport: vi.fn().mockRejectedValue(new Error('validation failed')) } as any,
      execution as any,
      metrics as any,
      retryPolicy as any,
    );
    const job = createJob({ name: 'discovery.import', data: { provider: 'hacker-news' } });

    await expect(processor.process(job as any)).rejects.toThrow('validation failed');

    expect(job.discard).toHaveBeenCalledTimes(1);
    expect(metrics.recordFailure).toHaveBeenCalledWith('content.pipeline', true);
    expect(execution.fail).toHaveBeenCalledWith(
      'exec-1',
      expect.any(Error),
      'non-retryable-error',
    );
  });
});
