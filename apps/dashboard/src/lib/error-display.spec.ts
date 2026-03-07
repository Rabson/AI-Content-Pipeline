import { describe, expect, it } from 'vitest';
import { extractErrorMessage, parseErrorInfo } from './error-display';

describe('error display helpers', () => {
  it('extracts backend validation messages from nested JSON payloads', () => {
    const error = parseErrorInfo(
      JSON.stringify({
        error: {
          code: 'UNHANDLED_ERROR',
          message: ['brief must be shorter than or equal to 3000 characters'],
          details: { statusCode: 400 },
        },
      }),
    );

    expect(error.code).toBe('UNHANDLED_ERROR');
    expect(error.message).toBe('brief must be shorter than or equal to 3000 characters');
    expect(error.details).toEqual({ statusCode: 400 });
  });

  it('falls back to plain error messages', () => {
    expect(extractErrorMessage(new Error('Request failed'))).toBe('Request failed');
  });
});
