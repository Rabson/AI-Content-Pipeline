import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { AppRole } from '../auth/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { OpsController } from '../../modules/ops/ops.controller';
import { PublisherController } from '../../modules/publisher/publisher.controller';
import { StorageController } from '../../modules/storage/storage.controller';
import { TopicController } from '../../modules/topic/topic.controller';

function methodRoles(target: object, methodName: string) {
  const method = Reflect.get(target, methodName) as object | undefined;
  return (
    (method ? (Reflect.getMetadata(ROLES_KEY, method) as AppRole[] | undefined) : undefined) ??
    (Reflect.getMetadata(ROLES_KEY, (target as { constructor: object }).constructor) as
      | AppRole[]
      | undefined)
  );
}

describe('RBAC metadata', () => {
  it('protects ops replay with ADMIN', () => {
    expect(methodRoles(OpsController.prototype, 'replayFailedJob')).toEqual([AppRole.ADMIN]);
  });

  it('protects publishing with USER role', () => {
    expect(methodRoles(PublisherController.prototype, 'publish')).toEqual([AppRole.USER]);
  });

  it('protects upload signing with EDITOR', () => {
    expect(Reflect.getMetadata(ROLES_KEY, StorageController)).toEqual([AppRole.EDITOR]);
  });

  it('requires REVIEWER for topic scoring and approval actions', () => {
    expect(methodRoles(TopicController.prototype, 'score')).toEqual([AppRole.REVIEWER]);
    expect(methodRoles(TopicController.prototype, 'approve')).toEqual([AppRole.REVIEWER]);
    expect(methodRoles(TopicController.prototype, 'reject')).toEqual([AppRole.REVIEWER]);
  });
});
