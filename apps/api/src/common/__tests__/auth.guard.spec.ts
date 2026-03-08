import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import { signServiceToken } from '@aicp/shared-config/auth/service-token';
import { AuthGuard } from '../guards/auth.guard';
import { env } from '../../config/env';
import { SecurityEventService } from '../security/security-event.service';

function contextFor(headers: Record<string, string>) {
  const request = { originalUrl: '/api/test', header: (name: string) => headers[name.toLowerCase()] } as any;
  return { getHandler: () => undefined, getClass: () => undefined, switchToHttp: () => ({ getRequest: () => request }) } as any;
}

function signedHeaders(role: string, email: string, subject: string) {
  return {
    authorization: `Bearer ${signServiceToken({
      secret: 'secret-token',
      issuer: 'aicp-dashboard',
      audience: 'aicp-api',
      subject,
      role,
      email,
      ttlSeconds: 60,
    })}`,
  };
}

describe('AuthGuard', () => {
  const reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector;
  const securityEventService = { authFailure: vi.fn().mockResolvedValue(undefined) } as unknown as SecurityEventService;
  const guard = new AuthGuard(reflector, securityEventService);
  const original = {
    appEnv: env.appEnv,
    authAllowHeaderBypass: env.authAllowHeaderBypass,
    internalServiceJwtSecret: env.internalServiceJwtSecret,
    internalServiceJwtIssuer: env.internalServiceJwtIssuer,
    internalServiceJwtAudience: env.internalServiceJwtAudience,
    internalServiceJwtClockSkewSeconds: env.internalServiceJwtClockSkewSeconds,
  };

  beforeEach(() => { reflector.getAllAndOverride = vi.fn().mockReturnValue(false); vi.clearAllMocks(); });
  afterEach(() => {
    env.appEnv = original.appEnv;
    env.authAllowHeaderBypass = original.authAllowHeaderBypass;
    env.internalServiceJwtSecret = original.internalServiceJwtSecret;
    env.internalServiceJwtIssuer = original.internalServiceJwtIssuer;
    env.internalServiceJwtAudience = original.internalServiceJwtAudience;
    env.internalServiceJwtClockSkewSeconds = original.internalServiceJwtClockSkewSeconds;
  });

  it('allows local bypass when enabled', async () => {
    env.appEnv = 'local';
    env.authAllowHeaderBypass = true;
    const ctx = contextFor({});
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('prefers a valid bearer token over local bypass', async () => {
    env.appEnv = 'local';
    env.authAllowHeaderBypass = true;
    env.internalServiceJwtSecret = 'secret-token';
    env.internalServiceJwtIssuer = 'aicp-dashboard';
    env.internalServiceJwtAudience = 'aicp-api';
    const ctx = contextFor(signedHeaders('USER', 'user42@example.com', 'user-42'));
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.user.id).toBe('user-42');
    expect(request.user.email).toBe('user42@example.com');
    expect(request.user.role).toBe('USER');
  });

  it('rejects non-local requests without a trusted internal token', async () => {
    env.appEnv = 'production';
    env.authAllowHeaderBypass = false;
    await expect(guard.canActivate(contextFor({}))).rejects.toThrow(UnauthorizedException);
    expect(securityEventService.authFailure).toHaveBeenCalled();
  });

  it('rejects invalid roles instead of downgrading them', async () => {
    env.appEnv = 'production';
    env.authAllowHeaderBypass = false;
    env.internalServiceJwtSecret = 'secret-token';
    env.internalServiceJwtIssuer = 'aicp-dashboard';
    env.internalServiceJwtAudience = 'aicp-api';
    await expect(guard.canActivate(contextFor(signedHeaders('OWNER', 'user@example.com', 'user-1')))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
