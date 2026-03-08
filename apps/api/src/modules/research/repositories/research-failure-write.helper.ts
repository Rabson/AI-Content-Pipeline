import { Prisma, TopicStatus } from '@prisma/client';
import type { PrismaService } from '@api/prisma/prisma.service';

export function persistFailedExecution(
  prisma: PrismaService,
  topicId: string,
  payload: Record<string, unknown>,
  error: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.topic.update({ where: { id: topicId }, data: { status: TopicStatus.FAILED } });
    await tx.topicStatusHistory.create({
      data: {
        topicId,
        fromStatus: TopicStatus.RESEARCH_IN_PROGRESS,
        toStatus: TopicStatus.FAILED,
        actorId: 'worker',
        reason: error,
        metadata: payload as Prisma.InputJsonValue,
      },
    });
  });
}
