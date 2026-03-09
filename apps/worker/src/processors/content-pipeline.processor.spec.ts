import { describe, expect, it } from 'vitest';
import { WorkerContentPipelineProcessor } from './content-pipeline.processor';
import {
  createExecutionServiceMock,
  createJob,
  createMetricsMock,
  createRetryPolicyMock,
} from './processor-test.helpers';

describe('WorkerContentPipelineProcessor', () => {
  it('returns null for unsupported job names', async () => {
    const execution = createExecutionServiceMock();
    const metrics = createMetricsMock();
    const processor = new WorkerContentPipelineProcessor(
      { runImport: async () => ({}) } as any,
      { run: async () => ({}) } as any,
      { run: async () => ({}) } as any,
      { markFailed: async () => undefined } as any,
      { processSection: async () => ({}), finalizeDraft: async () => ({}) } as any,
      { markDraftFailed: async () => undefined } as any,
      { processRevisionSection: async () => ({}), finalizeRevision: async () => ({}) } as any,
      { markRevisionRunFailed: async () => undefined } as any,
      { run: async () => ({}) } as any,
      execution as any,
      metrics as any,
      createRetryPolicyMock() as any,
    );

    const result = await processor.process(createJob({ name: 'content.pipeline.unknown' }) as any);

    expect(result).toBeNull();
    expect(metrics.recordSuccess).toHaveBeenCalledWith('content.pipeline');
    expect(execution.succeed).toHaveBeenCalledWith('exec-1');
  });
});
