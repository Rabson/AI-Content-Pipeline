import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { env } from '../../config/env';
import { parseAppRole } from '../auth/role-parser';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { SecurityEventService } from '../security/security-event.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityEventService: SecurityEventService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const canBypass = env.appEnv === 'local' && env.authAllowHeaderBypass;

    const actorId = request.header('x-actor-id')?.trim();
    const actorRole = request.header('x-actor-role')?.trim();
    const actorEmail = request.header('x-user-email')?.trim();
    const actorName = request.header('x-user-name')?.trim();

    if (canBypass) {
      request.user = {
        id: actorId || 'local-dev',
        role: parseAppRole(actorRole ?? 'ADMIN'),
        email: actorEmail || 'local-dev@example.com',
        name: actorName || 'Local Dev',
      };
      return true;
    }

    if (!this.hasTrustedInternalToken(request)) {
      this.securityEventService.authFailure({
        reason: 'invalid-internal-token',
        path: request.originalUrl,
      });
      throw new UnauthorizedException('Untrusted caller');
    }

    if (!actorId || !actorRole || !actorEmail) {
      this.securityEventService.authFailure({
        reason: 'missing-auth-headers',
        path: request.originalUrl,
      });
      throw new UnauthorizedException('Missing authenticated user headers');
    }

    try {
      request.user = {
        id: actorId,
        role: parseAppRole(actorRole),
        email: actorEmail,
        name: actorName,
      };
    } catch (error) {
      this.securityEventService.authFailure({
        reason: 'invalid-actor-role',
        path: request.originalUrl,
        actorRole,
      });
      throw error;
    }

    return true;
  }

  private hasTrustedInternalToken(request: AuthenticatedRequest) {
    const expectedToken = env.internalApiToken?.trim();
    const providedToken = request.header('x-internal-api-token')?.trim();
    return Boolean(expectedToken && providedToken && providedToken === expectedToken);
  }
}
