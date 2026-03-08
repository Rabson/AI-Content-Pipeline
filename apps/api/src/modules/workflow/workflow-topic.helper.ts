import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ContentState } from '@prisma/client';
import type { PrismaService } from '@api/prisma/prisma.service';

export function findTopic(prisma: PrismaService, topicId: string) {
  return prisma.topic.findUnique({ where: { id: topicId }, include: { contentItem: true } });
}

export async function ensureContentItemForTopic(prisma: PrismaService, topicId: string) {
  const topic = await findTopic(prisma, topicId);
  if (!topic) throw new NotFoundException('Topic not found');
  if (topic.contentItem) return topic.contentItem;

  return prisma.$transaction(async (tx) => {
    const current = await tx.topic.findUnique({ where: { id: topicId } });
    if (!current) throw new NotFoundException('Topic not found');
    if (current.contentItemId) {
      const existing = await tx.contentItem.findUnique({ where: { id: current.contentItemId } });
      if (!existing) throw new InternalServerErrorException('Linked content item not found');
      return existing;
    }

    const contentItem = await tx.contentItem.create({ data: { currentState: ContentState.TOPIC_INTAKE } });
    await tx.topic.update({ where: { id: topicId }, data: { contentItemId: contentItem.id } });
    return contentItem;
  });
}
