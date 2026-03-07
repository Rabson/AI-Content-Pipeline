import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../auth/roles.enum';
import { env } from '../../config/env';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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

    if (canBypass) {
      request.user = {
        id: actorId || 'local-dev',
        role: this.parseRole(actorRole ?? 'ADMIN'),
        email: actorEmail || 'local-dev@example.com',
      };
      return true;
    }

    if (!actorId || !actorRole || !actorEmail) {
      throw new UnauthorizedException('Missing authenticated user headers');
    }

    request.user = {
      id: actorId,
      role: this.parseRole(actorRole),
      email: actorEmail,
    };

    return true;
  }

  private parseRole(input: string): AppRole {
    if (input === AppRole.ADMIN) {
      return AppRole.ADMIN;
    }

    if (input === AppRole.REVIEWER) {
      return AppRole.REVIEWER;
    }

    return AppRole.EDITOR;
  }
}
