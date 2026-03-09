import { describe, expect, it, vi } from 'vitest';
import { AppRole } from '@api/common/auth/roles.enum';
import { UserAuthService } from '@api/modules/user/services/user-auth.service';

describe('Auth login integration', () => {
  it('returns an API token for valid credentials', async () => {
    const accountRepository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'editor@example.com',
        role: AppRole.EDITOR,
        isActive: true,
        passwordHash: 'hash',
        failedLoginAttempts: 0,
        lockedUntil: null,
        name: 'Editor',
      }),
      clearLoginFailures: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'editor@example.com',
        role: AppRole.EDITOR,
        name: 'Editor',
      }),
    };
    const service = new UserAuthService(
      accountRepository as any,
      { verify: vi.fn().mockReturnValue(true) } as any,
      { loginSucceeded: vi.fn(), loginFailed: vi.fn(), accountLocked: vi.fn() } as any,
    );

    const result = await service.login('editor@example.com', 'EditorPass123!');

    expect(result.role).toBe(AppRole.EDITOR);
    expect(result.apiToken).toContain('.');
    expect(result.apiTokenExpiresInSeconds).toBeGreaterThan(0);
  });
});
