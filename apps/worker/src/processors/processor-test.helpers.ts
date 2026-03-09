import { vi } from 'vitest';

export function createJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    name: 'unknown.job',
    queueName: 'content.pipeline',
    data: {},
    attemptsMade: 0,
    discard: vi.fn(),
    ...overrides,
  };
}

export function createExecutionServiceMock() {
  return {
    start: vi.fn().mockResolvedValue({ id: 'exec-1' }),
    succeed: vi.fn().mockResolvedValue(undefined),
    fail: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMetricsMock() {
  return {
    recordStart: vi.fn(),
    recordSuccess: vi.fn(),
    recordFailure: vi.fn(),
  };
}

export function createRetryPolicyMock(retryable = true, reason = 'retryable-transient-error') {
  return {
    classify: vi.fn().mockReturnValue({ retryable, reason }),
  };
}
