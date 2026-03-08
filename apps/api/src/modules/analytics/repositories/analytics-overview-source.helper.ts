import type { PrismaService } from '@api/prisma/prisma.service';

export function loadOverviewSourceData(prisma: PrismaService, start: Date) {
  return Promise.all([
    prisma.topic.findMany({
      where: { OR: [{ createdAt: { gte: start } }, { approvedAt: { gte: start } }] },
      select: { createdAt: true, approvedAt: true },
    }),
    prisma.revisionRun.findMany({
      where: { OR: [{ createdAt: { gte: start } }, { completedAt: { gte: start } }] },
      select: { createdAt: true, completedAt: true },
    }),
    prisma.publication.findMany({
      where: { OR: [{ createdAt: { gte: start } }, { publishedAt: { gte: start } }] },
      select: { createdAt: true, publishedAt: true, contentItem: { select: { createdAt: true } } },
    }),
    prisma.draftVersion.findMany({
      where: { approvedAt: { gte: start } },
      select: { approvedAt: true },
    }),
  ]);
}
