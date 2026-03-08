import { describe, expect, it } from 'vitest';
import { redactSensitiveValues } from './redact.util';

describe('redactSensitiveValues', () => {
  it('redacts nested secret-like keys', () => {
    expect(
      redactSensitiveValues({
        apiKey: 'abc',
        nested: {
          token: 'secret',
          safe: 'value',
        },
      }),
    ).toEqual({
      apiKey: '[REDACTED]',
      nested: {
        token: '[REDACTED]',
        safe: 'value',
      },
    });
  });

  it('keeps non-object values unchanged', () => {
    expect(redactSensitiveValues('plain')).toBe('plain');
    expect(redactSensitiveValues(['ok', { password: 'x' }])).toEqual(['ok', { password: '[REDACTED]' }]);
  });
});
