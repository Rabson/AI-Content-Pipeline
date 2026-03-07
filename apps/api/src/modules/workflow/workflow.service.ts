import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentState, Prisma, TopicStatus, WorkflowEventType, WorkflowRunStatus, WorkflowStage } from '@prisma/client';
import { WorkflowRepository } from './workflow.repository';
import { WorkflowTransitionService } from './workflow-transition.service';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly repository: WorkflowRepository,
    private readonly transitionService: WorkflowTransitionService,
  ) {}

  canTopicTransition(from: TopicStatus, to: TopicStatus): boolean {
    return this.transitionService.canTopicTransition(from, to);
  }

  assertTopicTransition(from: TopicStatus, to: TopicStatus): void {
    this.transitionService.assertTopicTransition(from, to);
  }

  canContentTransition(from: ContentState, to: ContentState): boolean {
    return this.transitionService.canContentTransition(from, to);
  }

  assertContentTransition(from: ContentState, to: ContentState): void {
    this.transitionService.assertContentTransition(from, to);
  }

  topicTransitions() {
    return this.transitionService.topicTransitions();
  }

  async ensureContentItemForTopic(topicId: string) {
    return this.repository.ensureContentItemForTopic(topicId);
  }

  async syncTopicStatus(params: {
    topicId: string;
    topicStatus: TopicStatus;
    stage: WorkflowStage;
    actorId?: string;
    metadata?: Prisma.InputJsonValue;
    eventType?: WorkflowEventType;
  }) {
    const target = this.transitionService.topicToContentState(params.topicStatus);
    if (!target) {
      return null;
    }

    const topic = await this.repository.findTopic(params.topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const contentItem = topic.contentItem ?? (await this.repository.ensureContentItemForTopic(params.topicId));
    const fromState = contentItem.currentState;

    if (!this.transitionService.canContentTransition(fromState, target) && fromState !== target) {
      throw new BadRequestException(`Invalid content state transition from ${fromState} to ${target}`);
    }

    return this.repository.setStateAndEvent({
      contentItemId: contentItem.id,
      topicId: params.topicId,
      stage: params.stage,
      actorId: params.actorId,
      fromState,
      toState: target,
      metadata: params.metadata,
      eventType: params.eventType,
    });
  }

  async transitionContentState(params: {
    topicId: string;
    stage: WorkflowStage;
    toState: ContentState;
    actorId?: string;
    metadata?: Prisma.InputJsonValue;
    eventType?: WorkflowEventType;
    workflowRunId?: string;
  }) {
    const topic = await this.repository.findTopic(params.topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const contentItem = topic.contentItem ?? (await this.repository.ensureContentItemForTopic(params.topicId));
    const fromState = contentItem.currentState;
    this.transitionService.assertContentTransition(fromState, params.toState);

    return this.repository.setStateAndEvent({
      contentItemId: contentItem.id,
      topicId: params.topicId,
      stage: params.stage,
      actorId: params.actorId,
      fromState,
      toState: params.toState,
      metadata: params.metadata,
      workflowRunId: params.workflowRunId,
      eventType: params.eventType,
    });
  }

  async recordEvent(params: {
    topicId: string;
    stage: WorkflowStage;
    eventType: WorkflowEventType;
    actorId?: string;
    metadata?: Prisma.InputJsonValue;
    workflowRunId?: string;
    fromState?: ContentState;
    toState?: ContentState;
  }) {
    const topic = await this.repository.findTopic(params.topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const contentItem = topic.contentItem ?? (await this.repository.ensureContentItemForTopic(params.topicId));

    return this.repository.createEvent({
      contentItemId: contentItem.id,
      topicId: params.topicId,
      workflowRunId: params.workflowRunId,
      stage: params.stage,
      eventType: params.eventType,
      actorId: params.actorId,
      metadata: params.metadata,
      fromState: params.fromState,
      toState: params.toState,
    });
  }

  async startRun(params: {
    topicId: string;
    stage: WorkflowStage;
    startedBy?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const topic = await this.repository.findTopic(params.topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const contentItem = topic.contentItem ?? (await this.repository.ensureContentItemForTopic(params.topicId));

    return this.repository.createRun({
      contentItemId: contentItem.id,
      topicId: params.topicId,
      stage: params.stage,
      status: WorkflowRunStatus.RUNNING,
      startedBy: params.startedBy,
      metadata: params.metadata,
    });
  }

  async completeRun(runId: string, metadata?: Prisma.InputJsonValue) {
    return this.repository.completeRun(runId, metadata);
  }

  async failRun(runId: string, metadata?: Prisma.InputJsonValue) {
    return this.repository.failRun(runId, metadata);
  }

  async setCurrentDraft(topicId: string, draftVersionId: string) {
    const topic = await this.repository.findTopic(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const contentItem = topic.contentItem ?? (await this.repository.ensureContentItemForTopic(topicId));
    return this.repository.markCurrentDraft(contentItem.id, draftVersionId);
  }

  async markApprovedDraft(topicId: string, draftVersionId: string, actorId?: string) {
    const topic = await this.repository.findTopic(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const contentItem = topic.contentItem ?? (await this.repository.ensureContentItemForTopic(topicId));
    await this.repository.markApprovedDraft(contentItem.id, draftVersionId);
    await this.recordEvent({
      topicId,
      stage: WorkflowStage.REVIEW,
      eventType: WorkflowEventType.DRAFT_APPROVED,
      actorId,
      metadata: { draftVersionId },
    });

    if (contentItem.currentState !== ContentState.READY_TO_PUBLISH) {
      await this.transitionContentState({
        topicId,
        stage: WorkflowStage.REVIEW,
        toState: ContentState.READY_TO_PUBLISH,
        actorId,
        metadata: { draftVersionId },
      });
    }
  }

  async lockForPublish(topicId: string, draftVersionId: string, locked: boolean) {
    const topic = await this.repository.findTopic(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const contentItem = topic.contentItem ?? (await this.repository.ensureContentItemForTopic(topicId));
    return this.repository.lockForPublish(contentItem.id, draftVersionId, locked);
  }

  listTopicEvents(topicId: string) {
    return this.repository.listTopicEvents(topicId);
  }

  listTopicRuns(topicId: string) {
    return this.repository.listTopicRuns(topicId);
  }
}
