import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyServiceToken } from '@aicp/shared-config/auth/service-token';
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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const serviceToken = this.readBearerToken(request);
    const canBypass = env.appEnv === 'local' && env.authAllowHeaderBypass;

    if (serviceToken) {
      try {
        const claims = verifyServiceToken({
          token: serviceToken,
          secret: env.internalServiceJwtSecret,
          expectedIssuer: env.internalServiceJwtIssuer,
          expectedAudience: env.internalServiceJwtAudience,
          clockSkewSeconds: env.internalServiceJwtClockSkewSeconds,
        });
        request.user = {
          id: claims.sub,
          role: parseAppRole(claims.role),
          email: claims.email,
          name: claims.name,
        };
        return true;
      } catch (error) {
        await this.securityEventService.authFailure({
          reason: 'invalid-service-token',
          path: request.originalUrl,
          error: error instanceof Error ? error.message : 'unknown',
        });
        throw new UnauthorizedException('Untrusted caller');
      }
    }

    if (canBypass) {
      request.user = {
        id: 'local-dev',
        role: parseAppRole('ADMIN'),
        email: 'local-dev@example.com',
        name: 'Local Dev',
      };
      return true;
    }

    await this.securityEventService.authFailure({
      reason: 'missing-service-token',
      path: request.originalUrl,
    });
    throw new UnauthorizedException('Untrusted caller');
  }

  private readBearerToken(request: AuthenticatedRequest) {
    const authorization = request.header('authorization')?.trim();
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }
    return authorization.slice('Bearer '.length).trim() || null;
  }
}
