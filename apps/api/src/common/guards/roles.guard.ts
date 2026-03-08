import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CasbinAuthorizationService } from '../auth/casbin-authorization.service';
import { AppRole } from '../auth/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: CasbinAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const decisions = await Promise.all(
      requiredRoles.map((requiredRole) => this.authorizationService.hasRole(userRole, requiredRole)),
    );
    const allowed = decisions.some(Boolean);

    if (!allowed) {
      throw new ForbiddenException('Insufficient role for requested operation');
    }

    return true;
  }
}
