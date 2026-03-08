import { Injectable } from '@nestjs/common';
import { Prisma, TopicStatus } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';
import { topicDetailInclude } from './repositories/topic-include.helper';
import { buildTopicListWhere } from './repositories/topic-query.helper';
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
      include: topicDetailInclude,
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
    const { skip, take } = params;

    return this.prisma.topic.findMany({
      where: buildTopicListWhere(params),
      orderBy: [{ scoreTotal: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
      include: topicDetailInclude,
    });
  }
  assignOwner(id: string, ownerUserId: string) {
    return this.prisma.topic.update({
      where: { id },
      data: { ownerUserId },
      include: topicDetailInclude,
    });
  }
  updateBannerImage(id: string, params: { storageObjectId: string | null; alt?: string | null; caption?: string | null }) {
    return this.prisma.topic.update({
      where: { id },
      data: {
        bannerImageStorageObjectId: params.storageObjectId,
        bannerImageAlt: params.alt,
        bannerImageCaption: params.caption,
      },
      include: topicDetailInclude,
    });
  }
  findOwner(id: string) {
    return this.prisma.topic.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, ownerUserId: true },
    });
  }

  findStorageObjectForTopic(topicId: string, storageObjectId: string) {
    return this.prisma.storageObject.findFirst({
      where: {
        id: storageObjectId,
        topicId,
      },
    });
  }

  update(id: string, data: Prisma.TopicUpdateInput) {
    return this.prisma.topic.update({
      where: { id },
      data,
      include: topicDetailInclude,
    });
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
