import { Injectable } from '@nestjs/common';
import { Prisma, ReviewCommentSeverity, ReviewCommentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createReviewComment, createReviewSession, submitReviewSession, updateReviewComment } from './draft-review-write.helper';
import { createUsageLog } from './draft-usage-write.helper';
import { createDraftShell, finalizeDraft, markDraftApproved, markDraftFailed, upsertDraftSection } from './draft-version-write.helper';

@Injectable()
export class DraftWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  createDraftShell(params: { topicId: string; actorId: string; payload: Record<string, unknown>; model?: string; promptHash?: string }) { return createDraftShell(this.prisma, params); }
  upsertDraftSection(params: { draftVersionId: string; sectionKey: string; heading: string; position: number; contentMd: string; model?: string; promptHash?: string }) { return upsertDraftSection(this.prisma, params); }
  finalizeDraft(draftVersionId: string) { return finalizeDraft(this.prisma, draftVersionId); }
  createReviewSession(params: { topicId: string; draftVersionId: string; reviewerId: string }) { return createReviewSession(this.prisma, params); }
  createReviewComment(params: { reviewSessionId: string; draftVersionId: string; sectionKey: string; commentMd: string; severity: ReviewCommentSeverity; actorId: string }) { return createReviewComment(this.prisma, params); }
  updateReviewComment(reviewSessionId: string, commentId: string, data: { status?: ReviewCommentStatus; resolutionNote?: string }) { return updateReviewComment(this.prisma, reviewSessionId, commentId, data); }
  submitReviewSession(reviewSessionId: string) { return submitReviewSession(this.prisma, reviewSessionId); }
  markDraftApproved(draftVersionId: string, actorId: string) { return markDraftApproved(this.prisma, draftVersionId, actorId); }
  markDraftFailed(draftVersionId: string) { return markDraftFailed(this.prisma, draftVersionId); }
  createUsageLog(data: Prisma.LlmUsageLogCreateInput) { return createUsageLog(this.prisma, data); }
}
