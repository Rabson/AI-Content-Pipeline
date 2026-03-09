import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { signServiceToken } from '@aicp/auth-core';
import { PublicationChannel } from '@prisma/client';
import { AuthGuard } from '@api/common/guards/auth.guard';
import { RolesGuard } from '@api/common/guards/roles.guard';
import { CasbinAuthorizationService } from '@api/common/auth/casbin-authorization.service';
import { PublisherController } from '@api/modules/publisher/publisher.controller';
import { env } from '@api/config/env';

function requestWithAuth(role?: string) {
  const token = role
    ? signServiceToken({
        secret: env.internalServiceJwtSecret,
        issuer: env.internalServiceJwtIssuer,
        audience: env.internalServiceJwtAudience,
        subject: 'user-1',
        email: 'user-1@example.com',
        role,
        ttlSeconds: 300,
      })
    : null;
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  return {
    ip: '127.0.0.1',
    originalUrl: '/api/v1/topics/topic-1/publications',
    user: undefined,
    header: (name: string) => headers[name.toLowerCase() as keyof typeof headers],
  } as any;
}

function contextFor(handler: object, request: any) {
  return {
    getHandler: () => handler,
    getClass: () => PublisherController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('Publish transport authz integration', () => {
  const originalAppEnv = env.appEnv;
  const originalBypass = env.authAllowHeaderBypass;

  beforeEach(() => {
    env.appEnv = 'production';
    env.authAllowHeaderBypass = false;
  });

  afterEach(() => {
    env.appEnv = originalAppEnv;
    env.authAllowHeaderBypass = originalBypass;
  });

  it('returns 401 when publish route is called without service token', async () => {
    const authGuard = new AuthGuard(new Reflector(), { authFailure: vi.fn().mockResolvedValue(undefined) } as any);
    const ctx = contextFor(PublisherController.prototype.publish, requestWithAuth());
    await expect(authGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('returns 403 when EDITOR token hits USER-only publish route', async () => {
    const request = requestWithAuth('EDITOR');
    const authGuard = new AuthGuard(new Reflector(), { authFailure: vi.fn().mockResolvedValue(undefined) } as any);
    const rolesGuard = new RolesGuard(new Reflector(), new CasbinAuthorizationService());
    const ctx = contextFor(PublisherController.prototype.publish, request);

    await expect(authGuard.canActivate(ctx)).resolves.toBe(true);
    await expect(rolesGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('returns 403 when publish/retry ownership checks fail for USER', async () => {
    const request = requestWithAuth('USER');
    const controller = new PublisherController(
      {
        enqueuePublication: vi.fn().mockRejectedValue(new ForbiddenException('Insufficient role for requested publication action')),
        retryPublication: vi.fn().mockRejectedValue(new ForbiddenException('Insufficient role for requested publication action')),
      } as any,
      { enforce: vi.fn().mockResolvedValue(undefined) } as any,
    );
    const authGuard = new AuthGuard(new Reflector(), { authFailure: vi.fn().mockResolvedValue(undefined) } as any);
    const rolesGuard = new RolesGuard(new Reflector(), new CasbinAuthorizationService());

    const publishCtx = contextFor(PublisherController.prototype.publish, request);
    await authGuard.canActivate(publishCtx);
    await rolesGuard.canActivate(publishCtx);
    await expect(
      controller.publish('topic-1', { channel: PublicationChannel.DEVTO, tags: [] } as any, request),
    ).rejects.toThrow(ForbiddenException);

    const retryCtx = contextFor(PublisherController.prototype.retry, request);
    await authGuard.canActivate(retryCtx);
    await rolesGuard.canActivate(retryCtx);
    await expect(controller.retry('topic-1', 'publication-1', request)).rejects.toThrow(ForbiddenException);
  });
});
