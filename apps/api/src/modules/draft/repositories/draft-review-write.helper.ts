import { NotFoundException } from '@nestjs/common';
import { ReviewCommentSeverity, ReviewCommentStatus, ReviewSessionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const createReviewSession = (prisma: PrismaService, params: { topicId: string; draftVersionId: string; reviewerId: string }) =>
  prisma.reviewSession.create({ data: { topicId: params.topicId, draftVersionId: params.draftVersionId, reviewerId: params.reviewerId, status: ReviewSessionStatus.OPEN } });

export async function createReviewComment(
  prisma: PrismaService,
  params: { reviewSessionId: string; draftVersionId: string; sectionKey: string; commentMd: string; severity: ReviewCommentSeverity; actorId: string },
) {
  const section = await prisma.draftSection.findFirst({ where: { draftVersionId: params.draftVersionId, sectionKey: params.sectionKey } });
  if (!section) throw new NotFoundException('Section not found for this draft version');
  return prisma.reviewComment.create({ data: { reviewSessionId: params.reviewSessionId, draftVersionId: params.draftVersionId, draftSectionId: section.id, sectionKey: params.sectionKey, commentMd: params.commentMd, severity: params.severity, createdBy: params.actorId } });
}

export async function updateReviewComment(
  prisma: PrismaService,
  reviewSessionId: string,
  commentId: string,
  data: { status?: ReviewCommentStatus; resolutionNote?: string },
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.reviewComment.updateMany({ where: { id: commentId, reviewSessionId }, data });
    if (updated.count !== 1) throw new NotFoundException('Review comment not found');
    return tx.reviewComment.findUniqueOrThrow({ where: { id: commentId } });
  });
}

export const submitReviewSession = (prisma: PrismaService, reviewSessionId: string) =>
  prisma.reviewSession.update({ where: { id: reviewSessionId }, data: { status: ReviewSessionStatus.SUBMITTED, submittedAt: new Date() } });
