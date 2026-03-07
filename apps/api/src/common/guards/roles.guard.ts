import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole, ROLE_PRIORITY } from '../auth/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = request.user?.role;

    if (!userRole) {
      throw new ForbiddenException('Missing authenticated user role');
    }

    const userPriority = ROLE_PRIORITY.indexOf(userRole);
    const allowed = requiredRoles.some(
      (requiredRole) => userPriority >= ROLE_PRIORITY.indexOf(requiredRole),
    );

    if (!allowed) {
      throw new ForbiddenException('Insufficient role for requested operation');
    }

    return true;
  }
}
