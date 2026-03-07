import { describe, expect, it } from 'vitest';
import { RetryPolicyService } from './retry-policy.service';

describe('RetryPolicyService', () => {
  const service = new RetryPolicyService();

  it('classifies transient transport and rate-limit errors as retryable', () => {
    expect(service.classify(new Error('429 rate limit exceeded'))).toEqual({
      retryable: true,
      reason: 'retryable-transient-error',
    });

    expect(service.classify(new Error('request timed out upstream'))).toEqual({
      retryable: true,
      reason: 'retryable-transient-error',
    });
  });

  it('classifies non-transient errors as non-retryable', () => {
    expect(service.classify(new Error('validation failed'))).toEqual({
      retryable: false,
      reason: 'non-retryable-error',
    });
  });
});
