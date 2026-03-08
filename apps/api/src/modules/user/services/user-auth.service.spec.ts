import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AppRole } from '@api/common/auth/roles.enum';
import { describe, expect, it, vi } from 'vitest';
import { UserAuthService } from './user-auth.service';

function createService(overrides: {
  findByEmail?: ReturnType<typeof vi.fn>;
  verify?: ReturnType<typeof vi.fn>;
  recordFailedLogin?: ReturnType<typeof vi.fn>;
  clearLoginFailures?: ReturnType<typeof vi.fn>;
} = {}) {
  const accountRepository = {
    findByEmail: overrides.findByEmail ?? vi.fn(),
    recordFailedLogin: overrides.recordFailedLogin ?? vi.fn(),
    clearLoginFailures: overrides.clearLoginFailures ?? vi.fn(),
  };
  const passwordService = { verify: overrides.verify ?? vi.fn() };
  const securityEventService = {
    loginFailed: vi.fn(),
    accountLocked: vi.fn(),
    loginSucceeded: vi.fn(),
  };

  return {
    service: new UserAuthService(accountRepository as any, passwordService as any, securityEventService as any),
    accountRepository,
    passwordService,
    securityEventService,
  };
}

describe('UserAuthService', () => {
  it('returns the authenticated user on valid credentials', async () => {
    const { service, accountRepository, passwordService, securityEventService } = createService();
    accountRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'editor@example.com',
      role: AppRole.EDITOR,
      isActive: true,
      passwordHash: 'hash',
      failedLoginAttempts: 0,
      lockedUntil: null,
      name: 'Editor',
    });
    passwordService.verify.mockReturnValue(true);
    accountRepository.clearLoginFailures.mockResolvedValue({
      id: 'user-1',
      email: 'editor@example.com',
      role: AppRole.EDITOR,
      name: 'Editor',
    });

    await expect(service.login('editor@example.com', 'EditorPass123!')).resolves.toMatchObject({
      id: 'user-1',
      email: 'editor@example.com',
      role: AppRole.EDITOR,
    });
    expect(securityEventService.loginSucceeded).toHaveBeenCalled();
  });

  it('rejects an inactive account', async () => {
    const { service, accountRepository, securityEventService } = createService();
    accountRepository.findByEmail.mockResolvedValue({
      id: 'user-2',
      email: 'user@example.com',
      isActive: false,
    });

    await expect(service.login('user@example.com', 'UserPass123!')).rejects.toThrow(UnauthorizedException);
    expect(securityEventService.loginFailed).toHaveBeenCalledWith(expect.objectContaining({ reason: 'inactive-account' }));
  });

  it('rejects a locked account', async () => {
    const { service, accountRepository, securityEventService } = createService();
    accountRepository.findByEmail.mockResolvedValue({
      id: 'user-3',
      email: 'reviewer@example.com',
      role: AppRole.REVIEWER,
      isActive: true,
      passwordHash: 'hash',
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 60_000),
    });

    await expect(service.login('reviewer@example.com', 'ReviewerPass123!')).rejects.toThrow(ForbiddenException);
    expect(securityEventService.accountLocked).toHaveBeenCalled();
  });
});
