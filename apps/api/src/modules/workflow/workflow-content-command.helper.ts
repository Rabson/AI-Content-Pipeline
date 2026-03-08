import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { WorkflowRepository } from './workflow.repository';
import type { WorkflowTransitionService } from './workflow-transition.service';
import type { SyncTopicStatusParams, TransitionContentStateParams } from './workflow.service.types';

export async function syncTopicStatus(
  repository: WorkflowRepository,
  transitionService: WorkflowTransitionService,
  params: SyncTopicStatusParams,
) {
  const target = transitionService.topicToContentState(params.topicStatus);
  if (!target) return null;

  const { topic, contentItem } = await loadWorkflowContext(repository, params.topicId);
  const fromState = contentItem.currentState;
  if (!transitionService.canContentTransition(fromState, target) && fromState !== target) {
    throw new BadRequestException(`Invalid content state transition from ${fromState} to ${target}`);
  }

  return repository.setStateAndEvent({
    contentItemId: contentItem.id,
    topicId: topic.id,
    stage: params.stage,
    actorId: params.actorId,
    fromState,
    toState: target,
    metadata: params.metadata,
    eventType: params.eventType,
  });
}

export async function transitionContentState(
  repository: WorkflowRepository,
  transitionService: WorkflowTransitionService,
  params: TransitionContentStateParams,
) {
  const { topic, contentItem } = await loadWorkflowContext(repository, params.topicId);
  transitionService.assertContentTransition(contentItem.currentState, params.toState);
  return repository.setStateAndEvent({
    contentItemId: contentItem.id,
    topicId: topic.id,
    stage: params.stage,
    actorId: params.actorId,
    fromState: contentItem.currentState,
    toState: params.toState,
    metadata: params.metadata,
    workflowRunId: params.workflowRunId,
    eventType: params.eventType,
  });
}

async function loadWorkflowContext(repository: WorkflowRepository, topicId: string) {
  const topic = await repository.findTopic(topicId);
  if (!topic) throw new NotFoundException('Topic not found');
  const contentItem = topic.contentItem ?? (await repository.ensureContentItemForTopic(topicId));
  return { topic, contentItem };
}
