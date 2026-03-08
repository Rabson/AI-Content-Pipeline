import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authOptions } from './auth-options';
import { env } from '../config/env';

type AuthorizeFn = (
  credentials?: { email?: string; password?: string },
  request?: { headers?: Record<string, string> },
) => Promise<{ role: string; name?: string | null } | null>;

function providerAuthorize(): AuthorizeFn {
  const provider = authOptions.providers?.[0] as {
    options?: { authorize?: AuthorizeFn };
  } | undefined;
  return provider?.options?.authorize as AuthorizeFn;
}

describe('dashboard auth options', () => {
  const authorize = providerAuthorize();
  const original = {
    apiBase: env.apiBase,
    authRateLimitMaxAttempts: env.authRateLimitMaxAttempts,
    authRateLimitWindowMs: env.authRateLimitWindowMs,
  };

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'user-1',
          email: 'editor@example.com',
          role: 'EDITOR',
          name: 'Editor User',
        }),
    } as Response);
    Object.assign(env as Record<string, unknown>, {
      apiBase: 'http://localhost:3001/api',
      authRateLimitMaxAttempts: 5,
      authRateLimitWindowMs: 60_000,
    });
  });

  it('accepts valid API credentials', async () => {
    const result = await authorize(
      { email: 'editor@example.com', password: 'EditorPass123!' },
      { headers: { 'x-forwarded-for': '127.0.0.1' } },
    );
    expect(result?.role).toBe('EDITOR');
    expect(result?.name).toBe('Editor User');
  });

  it('rejects invalid credentials from the API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const result = await authorize({ email: 'user@example.com', password: 'wrong-pass' }, { headers: { 'x-forwarded-for': '127.0.0.1' } });
    expect(result).toBeNull();
  });

  it('maps role and name into the JWT/session callbacks', async () => {
    const jwt = authOptions.callbacks?.jwt as NonNullable<typeof authOptions.callbacks>['jwt'];
    const session = authOptions.callbacks?.session as NonNullable<typeof authOptions.callbacks>['session'];

    const token = await jwt({
      token: { sub: 'user-1' } as any,
      user: { id: 'user-1', email: 'editor@example.com', role: 'EDITOR', name: 'Editor User' } as any,
      account: null,
      profile: undefined,
      trigger: 'signIn',
      session: undefined,
      isNewUser: false,
    });

    const mapped = await session({
      session: { user: { email: 'editor@example.com' } } as any,
      token,
      user: undefined,
      newSession: undefined,
      trigger: 'update',
    });

    const user = mapped.user as { role: string; id: string; name?: string | null };
    expect(user.role).toBe('EDITOR');
    expect(user.id).toBe('user-1');
    expect(user.name).toBe('Editor User');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.assign(env as Record<string, unknown>, original);
  });
});
