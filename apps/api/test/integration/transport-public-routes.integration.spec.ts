import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { IS_PUBLIC_KEY } from '@api/common/decorators/public.decorator';
import { AuthController } from '@api/modules/user/auth.controller';
import { SystemController } from '@api/modules/system/system.controller';
import { TopicController } from '@api/modules/topic/topic.controller';
import { PublisherController } from '@api/modules/publisher/publisher.controller';
import { UserController } from '@api/modules/user/user.controller';

function isPublic(controller: object, methodName: string) {
  const method = Reflect.get(controller, methodName) as object | undefined;
  return Boolean(
    (method ? Reflect.getMetadata(IS_PUBLIC_KEY, method) : undefined) ??
      Reflect.getMetadata(IS_PUBLIC_KEY, (controller as { constructor: object }).constructor),
  );
}

describe('Transport public route contract', () => {
  it('keeps only expected endpoints public', () => {
    expect(isPublic(AuthController.prototype, 'login')).toBe(true);
    expect(isPublic(SystemController.prototype, 'health')).toBe(true);
    expect(isPublic(SystemController.prototype, 'ready')).toBe(true);

    expect(isPublic(TopicController.prototype, 'list')).toBe(false);
    expect(isPublic(PublisherController.prototype, 'publish')).toBe(false);
    expect(isPublic(UserController.prototype, 'me')).toBe(false);
  });
});
