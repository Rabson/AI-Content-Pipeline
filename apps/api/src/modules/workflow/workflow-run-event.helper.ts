import { NotFoundException } from '@nestjs/common';
import { WorkflowRunStatus } from '@prisma/client';
import type { WorkflowRepository } from './workflow.repository';
import type { RecordWorkflowEventParams, StartWorkflowRunParams } from './workflow.service.types';

export async function recordWorkflowEvent(repository: WorkflowRepository, params: RecordWorkflowEventParams) {
  const { topic, contentItem } = await loadWorkflowContext(repository, params.topicId);
  return repository.createEvent({
    contentItemId: contentItem.id,
    topicId: topic.id,
    workflowRunId: params.workflowRunId,
    stage: params.stage,
    eventType: params.eventType,
    actorId: params.actorId,
    metadata: params.metadata,
    fromState: params.fromState,
    toState: params.toState,
  });
}

export async function startWorkflowRun(repository: WorkflowRepository, params: StartWorkflowRunParams) {
  const { topic, contentItem } = await loadWorkflowContext(repository, params.topicId);
  return repository.createRun({
    contentItemId: contentItem.id,
    topicId: topic.id,
    stage: params.stage,
    status: WorkflowRunStatus.RUNNING,
    startedBy: params.startedBy,
    metadata: params.metadata,
  });
}

async function loadWorkflowContext(repository: WorkflowRepository, topicId: string) {
  const topic = await repository.findTopic(topicId);
  if (!topic) throw new NotFoundException('Topic not found');
  const contentItem = topic.contentItem ?? (await repository.ensureContentItemForTopic(topicId));
  return { topic, contentItem };
}
