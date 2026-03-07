import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

export function updateContentItem(prisma: PrismaService, contentItemId: string, data: Prisma.ContentItemUncheckedUpdateInput) {
  return prisma.contentItem.update({ where: { id: contentItemId }, data });
}

export function markApprovedDraft(prisma: PrismaService, contentItemId: string, draftVersionId: string) {
  return prisma.contentItem.update({
    where: { id: contentItemId },
    data: { latestApprovedDraftVersionId: draftVersionId, currentDraftVersionId: draftVersionId },
  });
}

export function markCurrentDraft(prisma: PrismaService, contentItemId: string, draftVersionId: string) {
  return prisma.contentItem.update({ where: { id: contentItemId }, data: { currentDraftVersionId: draftVersionId } });
}

export function lockForPublish(
  prisma: PrismaService,
  contentItemId: string,
  draftVersionId: string,
  locked: boolean,
) {
  return prisma.contentItem.update({
    where: { id: contentItemId },
    data: { lockedForPublish: locked, currentDraftVersionId: draftVersionId },
  });
}
