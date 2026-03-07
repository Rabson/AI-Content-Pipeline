import type { ContentState, Prisma, TopicStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';

export interface SyncTopicStatusParams {
  topicId: string;
  topicStatus: TopicStatus;
  stage: WorkflowStage;
  actorId?: string;
  metadata?: Prisma.InputJsonValue;
  eventType?: WorkflowEventType;
}

export interface TransitionContentStateParams {
  topicId: string;
  stage: WorkflowStage;
  toState: ContentState;
  actorId?: string;
  metadata?: Prisma.InputJsonValue;
  eventType?: WorkflowEventType;
  workflowRunId?: string;
}

export interface RecordWorkflowEventParams {
  topicId: string;
  stage: WorkflowStage;
  eventType: WorkflowEventType;
  actorId?: string;
  metadata?: Prisma.InputJsonValue;
  workflowRunId?: string;
  fromState?: ContentState;
  toState?: ContentState;
}

export interface StartWorkflowRunParams {
  topicId: string;
  stage: WorkflowStage;
  startedBy?: string;
  metadata?: Prisma.InputJsonValue;
}
