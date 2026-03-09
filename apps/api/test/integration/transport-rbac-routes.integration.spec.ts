import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { AppRole } from '@api/common/auth/roles.enum';
import { ROLES_KEY } from '@api/common/decorators/roles.decorator';
import { AnalyticsController } from '@api/modules/analytics/analytics.controller';
import { DiscoveryController } from '@api/modules/discovery/discovery.controller';
import { DraftController } from '@api/modules/draft/draft.controller';
import { OpsController } from '@api/modules/ops/ops.controller';
import { OutlineController } from '@api/modules/outline/outline.controller';
import { PublisherController } from '@api/modules/publisher/publisher.controller';
import { ResearchController } from '@api/modules/research/research.controller';
import { RevisionController } from '@api/modules/revision/revision.controller';
import { SeoController } from '@api/modules/seo/seo.controller';
import { SocialController } from '@api/modules/social/social.controller';
import { StorageController } from '@api/modules/storage/storage.controller';
import { TopicController } from '@api/modules/topic/topic.controller';
import { UserController } from '@api/modules/user/user.controller';
import { WorkflowController } from '@api/modules/workflow/workflow.controller';

function rolesFor(controller: object, methodName: string) {
  const method = Reflect.get(controller, methodName) as object | undefined;
  return (
    (method ? (Reflect.getMetadata(ROLES_KEY, method) as AppRole[] | undefined) : undefined) ??
    (Reflect.getMetadata(ROLES_KEY, (controller as { constructor: object }).constructor) as AppRole[] | undefined)
  );
}

describe('Transport RBAC route contract', () => {
  it('applies expected roles on representative controller routes', () => {
    expect(rolesFor(AnalyticsController.prototype, 'rollup')).toEqual([AppRole.ADMIN]);
    expect(rolesFor(DiscoveryController.prototype, 'importTopics')).toEqual([AppRole.EDITOR]);
    expect(rolesFor(DraftController.prototype, 'generateDraft')).toEqual([AppRole.EDITOR]);
    expect(rolesFor(OpsController.prototype, 'runtimeStatus')).toEqual([AppRole.ADMIN]);
    expect(rolesFor(OutlineController.prototype, 'generate')).toEqual([AppRole.EDITOR]);
    expect(rolesFor(PublisherController.prototype, 'publish')).toEqual([AppRole.USER]);
    expect(rolesFor(ResearchController.prototype, 'run')).toEqual([AppRole.EDITOR]);
    expect(rolesFor(RevisionController.prototype, 'runRevision')).toEqual([AppRole.REVIEWER]);
    expect(rolesFor(SeoController.prototype, 'generate')).toEqual([AppRole.EDITOR]);
    expect(rolesFor(SocialController.prototype, 'generate')).toEqual([AppRole.EDITOR]);
    expect(rolesFor(StorageController.prototype, 'list')).toEqual([AppRole.USER]);
    expect(rolesFor(TopicController.prototype, 'assignOwner')).toEqual([AppRole.ADMIN]);
    expect(rolesFor(UserController.prototype, 'list')).toEqual([AppRole.ADMIN]);
    expect(rolesFor(WorkflowController.prototype, 'events')).toEqual([AppRole.EDITOR]);
  });
});
