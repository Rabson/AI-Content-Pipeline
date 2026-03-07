import { NotFoundException } from '@nestjs/common';
import { Prisma, TopicStatus } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { findTopicById } from './outline-read.helper';

export async function markOutlineFailed(prisma: PrismaService, topicId: string, error: string) {
  if (!(await findTopicById(prisma, topicId))) {
    throw new NotFoundException('Topic not found');
  }

  return prisma.topicStatusHistory.create({
    data: {
      topicId,
      fromStatus: TopicStatus.RESEARCH_READY,
      toStatus: TopicStatus.RESEARCH_READY,
      actorId: 'worker',
      reason: error,
      metadata: { stage: 'outline.generate' } as Prisma.InputJsonValue,
    },
  });
}
