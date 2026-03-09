import { describe, expect, it } from 'vitest';
import { redactSensitiveValues } from './redact.util';

describe('redactSensitiveValues', () => {
  it('redacts sensitive keys recursively', () => {
    const payload = {
      token: 'abc',
      nested: { password: 'secret', safe: 'ok' },
      items: [{ authorization: 'Bearer 123' }],
    };

    expect(redactSensitiveValues(payload)).toEqual({
      token: '[REDACTED]',
      nested: { password: '[REDACTED]', safe: 'ok' },
      items: [{ authorization: '[REDACTED]' }],
    });
  });
});
