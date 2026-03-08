import { Prisma, WorkflowEventType } from '@prisma/client';
import type { PrismaService } from '@api/prisma/prisma.service';

export function createEvent(prisma: PrismaService, data: Prisma.WorkflowEventUncheckedCreateInput) {
  return prisma.workflowEvent.create({ data });
}

export function listTopicEvents(prisma: PrismaService, topicId: string) {
  return prisma.workflowEvent.findMany({ where: { topicId }, orderBy: { createdAt: 'desc' } });
}

export function setStateAndEvent(
  prisma: PrismaService,
  params: {
    contentItemId: string;
    topicId?: string;
    stage: Prisma.WorkflowEventUncheckedCreateInput['stage'];
    actorId?: string;
    fromState?: Prisma.WorkflowEventUncheckedCreateInput['fromState'];
    toState: Prisma.WorkflowEventUncheckedCreateInput['toState'];
    metadata?: Prisma.InputJsonValue;
    workflowRunId?: string;
    eventType?: WorkflowEventType;
  },
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.contentItem.update({ where: { id: params.contentItemId }, data: { currentState: params.toState } });
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
