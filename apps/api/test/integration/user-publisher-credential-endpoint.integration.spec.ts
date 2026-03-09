import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserPublisherCredentialController } from '@api/modules/user/user-publisher-credential.controller';
import { UserPublisherCredentialService } from '@api/modules/user/services/user-publisher-credential.service';

describe('UserPublisherCredentialController endpoint transport', () => {
  const listOwn = vi.fn().mockResolvedValue([]);

  afterEach(() => {
    listOwn.mockClear();
  });

  it('maps credential list route and delegates to service', async () => {
    const controller = new UserPublisherCredentialController({
      listOwn,
      upsertOwn: vi.fn(),
      deleteOwn: vi.fn(),
    } as unknown as UserPublisherCredentialService);

    const method = Reflect.get(controller, 'list') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('/');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.GET);

    await controller.list({ user: { id: 'user-1' } } as never);
    expect(listOwn).toHaveBeenCalled();
  });
});
