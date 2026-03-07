import { NotFoundException } from '@nestjs/common';
import { SocialPlatform } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

export function findTopicById(prisma: PrismaService, topicId: string) {
  return prisma.topic.findFirst({
    where: { id: topicId, deletedAt: null },
    include: { contentItem: true },
  });
}

export function getLatestDraft(prisma: PrismaService, topicId: string) {
  return prisma.draftVersion.findFirst({ where: { topicId }, orderBy: { versionNumber: 'desc' } });
}

export function latestLinkedInDraft(prisma: PrismaService, topicId: string) {
  return prisma.socialPost.findFirst({
    where: { topicId, platform: SocialPlatform.LINKEDIN },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
}

export async function getSocialPostOrThrow(prisma: PrismaService, id: string) {
  const post = await prisma.socialPost.findUnique({
    where: { id },
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
  });

  if (!post) {
    throw new NotFoundException('Social post not found');
  }

  return post;
}

export async function nextVersion(prisma: PrismaService, topicId: string, platform: SocialPlatform) {
  const post = await prisma.socialPost.findFirst({
    where: { topicId, platform },
    select: { latestVersionNumber: true },
  });

  return (post?.latestVersionNumber ?? 0) + 1;
}
