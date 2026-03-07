import { ContentState, WorkflowEventType, WorkflowStage } from '@prisma/client';
import type { WorkflowRepository } from './workflow.repository';
import type { WorkflowService } from './workflow.service';

export async function setCurrentDraft(repository: WorkflowRepository, topicId: string, draftVersionId: string) {
  const contentItem = await getContentItem(repository, topicId);
  return repository.markCurrentDraft(contentItem.id, draftVersionId);
}

export async function markApprovedDraft(
  repository: WorkflowRepository,
  workflowService: WorkflowService,
  topicId: string,
  draftVersionId: string,
  actorId?: string,
) {
  const contentItem = await getContentItem(repository, topicId);
  await repository.markApprovedDraft(contentItem.id, draftVersionId);
  await workflowService.recordEvent({
    topicId,
    stage: WorkflowStage.REVIEW,
    eventType: WorkflowEventType.DRAFT_APPROVED,
    actorId,
    metadata: { draftVersionId },
  });
  if (contentItem.currentState !== ContentState.READY_TO_PUBLISH) {
    await workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.REVIEW,
      toState: ContentState.READY_TO_PUBLISH,
      actorId,
      metadata: { draftVersionId },
    });
  }
}

export async function lockDraftForPublish(
  repository: WorkflowRepository,
  topicId: string,
  draftVersionId: string,
  locked: boolean,
) {
  const contentItem = await getContentItem(repository, topicId);
  return repository.lockForPublish(contentItem.id, draftVersionId, locked);
}

async function getContentItem(repository: WorkflowRepository, topicId: string) {
  const topic = await repository.findTopic(topicId);
  if (!topic) throw new Error('Topic not found');
  return topic.contentItem ?? repository.ensureContentItemForTopic(topicId);
}
