import { ConflictException } from '@nestjs/common';
import { Prisma, TopicStatus } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

export async function transitionTopicStatus(
  prisma: PrismaService,
  params: {
    topicId: string;
    fromStatus: TopicStatus;
    toStatus: TopicStatus;
    actorId: string;
    reason?: string;
    metadata?: Prisma.JsonObject;
    topicUpdate?: Prisma.TopicUpdateManyMutationInput;
  },
) {
  const { topicId, fromStatus, toStatus, actorId, reason, metadata, topicUpdate } = params;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.topic.updateMany({
      where: { id: topicId, status: fromStatus, deletedAt: null },
      data: { status: toStatus, ...(topicUpdate ?? {}) },
    });
    if (updated.count !== 1) throw new ConflictException('Status transition failed due to stale state');
    await tx.topicStatusHistory.create({
      data: { topicId, fromStatus, toStatus, actorId, reason, metadata },
    });
    return tx.topic.findUnique({ where: { id: topicId }, include: { tags: true } });
  });
}
