import { Injectable } from '@nestjs/common';

@Injectable()
export class RetryPolicyService {
  classify(error: unknown): { retryable: boolean; reason: string } {
    const message = error instanceof Error ? error.message : String(error);
    const retryablePattern =
      /(429|timeout|timed out|ETIMEDOUT|ECONNRESET|EAI_AGAIN|ENOTFOUND|503|502|504|rate limit|temporarily unavailable)/i;

    if (retryablePattern.test(message)) {
      return {
        retryable: true,
        reason: 'retryable-transient-error',
      };
    }

    return {
      retryable: false,
      reason: 'non-retryable-error',
    };
  }
}
