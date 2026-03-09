import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserController } from '@api/modules/user/user.controller';
import { UserAccountService } from '@api/modules/user/services/user-account.service';

describe('UserController endpoint transport', () => {
  const getUser = vi.fn().mockResolvedValue({ id: 'user-1' });

  afterEach(() => {
    getUser.mockClear();
  });

  it('maps user me route and delegates to service', async () => {
    const controller = new UserController({
      getUser,
      listUsers: vi.fn(),
      createUser: vi.fn(),
    } as unknown as UserAccountService);

    const method = Reflect.get(controller, 'me') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('me');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.GET);

    await controller.me({ user: { id: 'user-1' } } as never);
    expect(getUser).toHaveBeenCalled();
  });
});
