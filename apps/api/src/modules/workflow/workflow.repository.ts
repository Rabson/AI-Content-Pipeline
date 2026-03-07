import { Injectable } from '@nestjs/common';
import {
  ContentState,
  Prisma,
  WorkflowEventType,
  WorkflowRunStatus,
  WorkflowStage,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopic(topicId: string) {
    return this.prisma.topic.findUnique({
      where: { id: topicId },
      include: { contentItem: true },
    });
  }

  async ensureContentItemForTopic(topicId: string) {
    const topic = await this.findTopic(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    if (topic.contentItem) {
      return topic.contentItem;
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.topic.findUnique({ where: { id: topicId } });
      if (!current) {
        throw new Error('Topic not found');
      }

      if (current.contentItemId) {
        const existing = await tx.contentItem.findUnique({ where: { id: current.contentItemId } });
        if (!existing) {
          throw new Error('Linked content item not found');
        }

        return existing;
      }

      const contentItem = await tx.contentItem.create({
        data: {
          currentState: ContentState.TOPIC_INTAKE,
        },
      });

      await tx.topic.update({
        where: { id: topicId },
        data: { contentItemId: contentItem.id },
      });

      return contentItem;
    });
  }

  createEvent(data: Prisma.WorkflowEventUncheckedCreateInput) {
    return this.prisma.workflowEvent.create({ data });
  }

  createRun(data: Prisma.WorkflowRunUncheckedCreateInput) {
    return this.prisma.workflowRun.create({ data });
  }

  updateRun(runId: string, data: Prisma.WorkflowRunUncheckedUpdateInput) {
    return this.prisma.workflowRun.update({ where: { id: runId }, data });
  }

  updateContentItem(contentItemId: string, data: Prisma.ContentItemUncheckedUpdateInput) {
    return this.prisma.contentItem.update({ where: { id: contentItemId }, data });
  }

  async setStateAndEvent(params: {
    contentItemId: string;
    topicId?: string;
    stage: WorkflowStage;
    actorId?: string;
    fromState?: ContentState;
    toState: ContentState;
    metadata?: Prisma.InputJsonValue;
    workflowRunId?: string;
    eventType?: WorkflowEventType;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.contentItem.update({
        where: { id: params.contentItemId },
        data: { currentState: params.toState },
      });

      await tx.workflowEvent.create({
        data: {
          contentItemId: params.contentItemId,
          topicId: params.topicId,
          workflowRunId: params.workflowRunId,
          stage: params.stage,
          eventType: params.eventType ?? WorkflowEventType.TRANSITION,
          fromState: params.fromState,
          toState: params.toState,
          actorId: params.actorId,
          metadata: params.metadata,
        },
      });

      return item;
    });
  }

  latestRun(contentItemId: string, stage: WorkflowStage) {
    return this.prisma.workflowRun.findFirst({
      where: { contentItemId, stage },
      orderBy: { startedAt: 'desc' },
    });
  }

  listTopicEvents(topicId: string) {
    return this.prisma.workflowEvent.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listTopicRuns(topicId: string) {
    return this.prisma.workflowRun.findMany({
      where: { topicId },
      orderBy: { startedAt: 'desc' },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
  }

  markApprovedDraft(contentItemId: string, draftVersionId: string) {
    return this.prisma.contentItem.update({
      where: { id: contentItemId },
      data: {
        latestApprovedDraftVersionId: draftVersionId,
        currentDraftVersionId: draftVersionId,
      },
    });
  }

  markCurrentDraft(contentItemId: string, draftVersionId: string) {
    return this.prisma.contentItem.update({
      where: { id: contentItemId },
      data: {
        currentDraftVersionId: draftVersionId,
      },
    });
  }

  lockForPublish(contentItemId: string, draftVersionId: string, locked: boolean) {
    return this.prisma.contentItem.update({
      where: { id: contentItemId },
      data: {
        lockedForPublish: locked,
        currentDraftVersionId: draftVersionId,
      },
    });
  }

  completeRun(runId: string, metadata?: Prisma.InputJsonValue) {
    return this.prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: WorkflowRunStatus.SUCCEEDED,
        endedAt: new Date(),
        metadata,
      },
    });
  }

  failRun(runId: string, metadata?: Prisma.InputJsonValue) {
    return this.prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: WorkflowRunStatus.FAILED,
        endedAt: new Date(),
        metadata,
      },
    });
  }
}
