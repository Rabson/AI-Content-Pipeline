import { describe, expect, it } from 'vitest';
import { signServiceToken, verifyServiceToken } from './service-token';

describe('service token', () => {
  it('signs and verifies a valid token', () => {
    const token = signServiceToken({
      secret: 'secret-1',
      issuer: 'aicp-dashboard',
      audience: 'aicp-api',
      subject: 'user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      ttlSeconds: 300,
    });

    const claims = verifyServiceToken({
      token,
      secret: 'secret-1',
      expectedIssuer: 'aicp-dashboard',
      expectedAudience: 'aicp-api',
      clockSkewSeconds: 0,
    });

    expect(claims.sub).toBe('user-1');
    expect(claims.role).toBe('ADMIN');
  });

  it('rejects token with invalid signature', () => {
    const token = signServiceToken({
      secret: 'secret-1',
      issuer: 'aicp-dashboard',
      audience: 'aicp-api',
      subject: 'user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      ttlSeconds: 300,
    });

    const tampered = `${token.slice(0, -1)}x`;
    expect(() =>
      verifyServiceToken({
        token: tampered,
        secret: 'secret-1',
        expectedIssuer: 'aicp-dashboard',
        expectedAudience: 'aicp-api',
      }),
    ).toThrow('Invalid service token signature');
  });
});
