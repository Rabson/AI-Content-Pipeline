import { Injectable } from '@nestjs/common';
import { Prisma, TopicStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TopicRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TopicCreateInput) {
    return this.prisma.topic.create({ data });
  }

  findById(id: string) {
    return this.prisma.topic.findFirst({
      where: { id, deletedAt: null },
      include: { tags: true },
    });
  }

  findMany(params: {
    status?: TopicStatus;
    q?: string;
    minScore?: number;
    skip: number;
    take: number;
  }) {
    const { status, q, minScore, skip, take } = params;

    return this.prisma.topic.findMany({
      where: {
        deletedAt: null,
        status,
        scoreTotal: minScore === undefined ? undefined : { gte: minScore },
        OR: q
          ? [
              { title: { contains: q, mode: 'insensitive' } },
              { brief: { contains: q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: [{ scoreTotal: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
      include: { tags: true },
    });
  }

  update(id: string, data: Prisma.TopicUpdateInput) {
    return this.prisma.topic.update({ where: { id }, data, include: { tags: true } });
  }

  async transitionStatus(params: {
    topicId: string;
    fromStatus: TopicStatus;
    toStatus: TopicStatus;
    actorId: string;
    reason?: string;
    metadata?: Prisma.JsonObject;
    topicUpdate?: Prisma.TopicUpdateManyMutationInput;
  }) {
    const { topicId, fromStatus, toStatus, actorId, reason, metadata, topicUpdate } = params;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.topic.updateMany({
        where: { id: topicId, status: fromStatus, deletedAt: null },
        data: {
          status: toStatus,
          ...(topicUpdate ?? {}),
        },
      });

      if (updated.count !== 1) {
        throw new Error('Status transition failed due to stale state');
      }

      await tx.topicStatusHistory.create({
        data: {
          topicId,
          fromStatus,
          toStatus,
          actorId,
          reason,
          metadata,
        },
      });

      return tx.topic.findUnique({ where: { id: topicId }, include: { tags: true } });
    });
  }

  findStatusHistory(topicId: string) {
    return this.prisma.topicStatusHistory.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
