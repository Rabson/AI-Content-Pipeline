import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AppRole } from '../../../common/auth/roles.enum';
import { SecurityEventService } from '../../../common/security/security-event.service';
import { env } from '../../../config/env';
import { UserAccountRepository } from '../repositories/user-account.repository';
import { PasswordService } from './password.service';

export class AuthenticatedUserView {
  id!: string;
  email!: string;
  role!: AppRole;
  name?: string | null;
}

@Injectable()
export class UserAuthService {
  constructor(
    private readonly accountRepository: UserAccountRepository,
    private readonly passwordService: PasswordService,
    private readonly securityEventService: SecurityEventService,
  ) {}

  async login(
    email: string,
    password: string,
    context: { ipAddress?: string | null; userAgent?: string | null; path?: string | null } = {},
  ): Promise<AuthenticatedUserView> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.accountRepository.findByEmail(normalizedEmail);
    if (!user?.isActive) {
      await this.securityEventService.loginFailed({
        subjectEmail: normalizedEmail,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        path: context.path,
        reason: user ? 'inactive-account' : 'unknown-email',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await this.securityEventService.accountLocked({
        subjectUserId: user.id,
        subjectEmail: user.email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        path: context.path,
        lockedUntil: user.lockedUntil.toISOString(),
      });
      throw new ForbiddenException('Account temporarily locked');
    }

    if (!this.passwordService.verify(password, user.passwordHash)) {
      const lockedUntil = user.failedLoginAttempts + 1 >= env.authLockoutThreshold
        ? new Date(Date.now() + env.authLockoutWindowMs)
        : null;
      const updated = await this.accountRepository.recordFailedLogin(user.id, lockedUntil);
      await this.securityEventService.loginFailed({
        subjectUserId: user.id,
        subjectEmail: user.email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        path: context.path,
        failedLoginAttempts: updated.failedLoginAttempts,
        lockedUntil: updated.lockedUntil?.toISOString() ?? null,
      });
      if (lockedUntil) {
        await this.securityEventService.accountLocked({
          subjectUserId: user.id,
          subjectEmail: user.email,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          path: context.path,
          lockedUntil: lockedUntil.toISOString(),
        });
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    const authenticatedUser = await this.accountRepository.clearLoginFailures(user.id);
    await this.securityEventService.loginSucceeded({
      subjectUserId: authenticatedUser.id,
      subjectEmail: authenticatedUser.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      path: context.path,
    });

    return {
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      role: authenticatedUser.role as AppRole,
      name: authenticatedUser.name,
    };
  }
}
