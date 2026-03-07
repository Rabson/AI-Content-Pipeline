import { Prisma, WorkflowRunStatus, WorkflowStage } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

export function createRun(prisma: PrismaService, data: Prisma.WorkflowRunUncheckedCreateInput) {
  return prisma.workflowRun.create({ data });
}

export function updateRun(prisma: PrismaService, runId: string, data: Prisma.WorkflowRunUncheckedUpdateInput) {
  return prisma.workflowRun.update({ where: { id: runId }, data });
}

export function latestRun(prisma: PrismaService, contentItemId: string, stage: WorkflowStage) {
  return prisma.workflowRun.findFirst({ where: { contentItemId, stage }, orderBy: { startedAt: 'desc' } });
}

export function listTopicRuns(prisma: PrismaService, topicId: string) {
  return prisma.workflowRun.findMany({
    where: { topicId },
    orderBy: { startedAt: 'desc' },
    include: { events: { orderBy: { createdAt: 'asc' } } },
  });
}

export function completeRun(prisma: PrismaService, runId: string, metadata?: Prisma.InputJsonValue) {
  return prisma.workflowRun.update({
    where: { id: runId },
    data: { status: WorkflowRunStatus.SUCCEEDED, endedAt: new Date(), metadata },
  });
}

export function failRun(prisma: PrismaService, runId: string, metadata?: Prisma.InputJsonValue) {
  return prisma.workflowRun.update({
    where: { id: runId },
    data: { status: WorkflowRunStatus.FAILED, endedAt: new Date(), metadata },
  });
}
