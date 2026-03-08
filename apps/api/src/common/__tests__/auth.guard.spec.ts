import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { env } from '../../config/env';
import { SecurityEventService } from '../security/security-event.service';

function contextFor(headers: Record<string, string>) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        originalUrl: '/api/test',
        header: (name: string) => headers[name.toLowerCase()],
      }),
    }),
  } as any;
}

describe('AuthGuard', () => {
  const reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector;
  const securityEventService = { authFailure: vi.fn() } as unknown as SecurityEventService;
  const guard = new AuthGuard(reflector, securityEventService);
  const original = { appEnv: env.appEnv, authAllowHeaderBypass: env.authAllowHeaderBypass, internalApiToken: env.internalApiToken };

  beforeEach(() => {
    reflector.getAllAndOverride = vi.fn().mockReturnValue(false);
    vi.clearAllMocks();
  });

  afterEach(() => {
    env.appEnv = original.appEnv;
    env.authAllowHeaderBypass = original.authAllowHeaderBypass;
    env.internalApiToken = original.internalApiToken;
  });

  it('allows local bypass when enabled', () => {
    env.appEnv = 'local';
    env.authAllowHeaderBypass = true;
    const ctx = contextFor({});
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects non-local requests without a trusted internal token', () => {
    env.appEnv = 'production';
    env.authAllowHeaderBypass = false;
    env.internalApiToken = 'secret-token';
    expect(() => guard.canActivate(contextFor({}))).toThrow(UnauthorizedException);
    expect(securityEventService.authFailure).toHaveBeenCalled();
  });

  it('rejects invalid roles instead of downgrading them', () => {
    env.appEnv = 'production';
    env.authAllowHeaderBypass = false;
    env.internalApiToken = 'secret-token';

    expect(() =>
      guard.canActivate(
        contextFor({
          'x-internal-api-token': 'secret-token',
          'x-actor-id': 'user-1',
          'x-actor-role': 'OWNER',
          'x-user-email': 'user@example.com',
        }),
      ),
    ).toThrow(UnauthorizedException);
  });
});
