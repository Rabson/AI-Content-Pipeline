import { Injectable } from '@nestjs/common';
import { Prisma, TopicStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { transitionTopicStatus } from './repositories/topic-status-transition.helper';

@Injectable()
export class TopicRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TopicCreateInput) {
    return this.prisma.topic.create({ data });
  }

  findById(id: string) {
    return this.prisma.topic.findFirst({
      where: { id, deletedAt: null },
      include: { tags: true, owner: { select: { id: true, email: true, name: true, role: true } } },
    });
  }

  findMany(params: {
    status?: TopicStatus;
    q?: string;
    minScore?: number;
    ownerUserId?: string;
    skip: number;
    take: number;
  }) {
    const { status, q, minScore, ownerUserId, skip, take } = params;

    return this.prisma.topic.findMany({
      where: {
        deletedAt: null,
        status,
        ownerUserId,
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
      include: { tags: true, owner: { select: { id: true, email: true, name: true, role: true } } },
    });
  }

  assignOwner(id: string, ownerUserId: string) {
    return this.prisma.topic.update({
      where: { id },
      data: { ownerUserId },
      include: { tags: true, owner: { select: { id: true, email: true, name: true, role: true } } },
    });
  }

  findOwner(id: string) {
    return this.prisma.topic.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, ownerUserId: true },
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
    return transitionTopicStatus(this.prisma, params);
  }

  findStatusHistory(topicId: string) {
    return this.prisma.topicStatusHistory.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
