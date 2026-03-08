import { ArtifactType } from '@prisma/client';
import type { PrismaService } from '@api/prisma/prisma.service';

export function findTopicById(prisma: PrismaService, topicId: string) {
  return prisma.topic.findFirst({ where: { id: topicId, deletedAt: null } });
}

export function latestOutline(prisma: PrismaService, topicId: string) {
  return prisma.outline.findFirst({
    where: { topicId },
    orderBy: { createdAt: 'desc' },
    include: { sections: { orderBy: { position: 'asc' } }, artifactVersion: true },
  });
}

export function outlineByVersion(prisma: PrismaService, topicId: string, versionNumber: number) {
  return prisma.outline.findFirst({
    where: {
      topicId,
      artifactVersion: { artifactType: ArtifactType.OUTLINE, versionNumber },
    },
    include: { sections: { orderBy: { position: 'asc' } }, artifactVersion: true },
  });
}

export async function getNextVersion(prisma: PrismaService, topicId: string): Promise<number> {
  const latest = await prisma.artifactVersion.findFirst({
    where: { topicId, artifactType: ArtifactType.OUTLINE },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });

  return (latest?.versionNumber ?? 0) + 1;
}

export function getLatestResearch(prisma: PrismaService, topicId: string) {
  return prisma.researchArtifact.findFirst({
    where: { topicId },
    orderBy: { createdAt: 'desc' },
    include: { keyPoints: true },
  });
}
