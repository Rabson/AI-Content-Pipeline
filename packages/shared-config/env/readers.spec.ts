import { afterEach, describe, expect, it } from 'vitest';
import { firstCsvValue, readBoolean, readNumber, readOptional, readString } from './readers';

const SHARED_ENV_KEYS = ['AICP_STRING', 'AICP_OPTIONAL', 'AICP_BOOLEAN', 'AICP_NUMBER'];

afterEach(() => {
  SHARED_ENV_KEYS.forEach((key) => {
    delete process.env[key];
  });
});

describe('shared env readers', () => {
  it('reads required strings and optional values', () => {
    process.env.AICP_STRING = ' value ';
    process.env.AICP_OPTIONAL = '  ';
    expect(readString('AICP_STRING', 'fallback')).toBe('value');
    expect(readOptional('AICP_OPTIONAL')).toBeUndefined();
  });

  it('reads booleans and numbers with fallback', () => {
    process.env.AICP_BOOLEAN = 'true';
    process.env.AICP_NUMBER = '42';
    expect(readBoolean('AICP_BOOLEAN', false)).toBe(true);
    expect(readNumber('AICP_NUMBER', 0)).toBe(42);
    expect(readNumber('MISSING_NUMBER', 7)).toBe(7);
  });

  it('extracts first csv value', () => {
    expect(firstCsvValue('alpha, beta, gamma', 'fallback')).toBe('alpha');
    expect(firstCsvValue(undefined, 'fallback')).toBe('fallback');
  });
});
