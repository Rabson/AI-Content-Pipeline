import { Injectable } from '@nestjs/common';
import { Prisma, ReviewCommentSeverity, ReviewCommentStatus } from '@prisma/client';
import { DraftReadRepository } from './repositories/draft-read.repository';
import { DraftWriteRepository } from './repositories/draft-write.repository';

@Injectable()
export class DraftRepository {
  constructor(
    private readonly readRepository: DraftReadRepository,
    private readonly writeRepository: DraftWriteRepository,
  ) {}

  findTopicById(topicId: string) {
    return this.readRepository.findTopicById(topicId);
  }

  getLatestOutline(topicId: string) {
    return this.readRepository.getLatestOutline(topicId);
  }

  findInProgressDraft(topicId: string) {
    return this.readRepository.findInProgressDraft(topicId);
  }

  createDraftShell(params: {
    topicId: string;
    actorId: string;
    payload: Record<string, unknown>;
    model?: string;
    promptHash?: string;
  }) {
    return this.writeRepository.createDraftShell(params);
  }

  upsertDraftSection(params: {
    draftVersionId: string;
    sectionKey: string;
    heading: string;
    position: number;
    contentMd: string;
    model?: string;
    promptHash?: string;
  }) {
    return this.writeRepository.upsertDraftSection(params);
  }

  finalizeDraft(draftVersionId: string) {
    return this.writeRepository.finalizeDraft(draftVersionId);
  }

  listDraftVersions(topicId: string, skip: number, take: number) {
    return this.readRepository.listDraftVersions(topicId, skip, take);
  }

  getDraftByVersion(topicId: string, versionNumber: number) {
    return this.readRepository.getDraftByVersion(topicId, versionNumber);
  }

  getLatestDraft(topicId: string) {
    return this.readRepository.getLatestDraft(topicId);
  }

  getLatestDraftById(draftVersionId: string) {
    return this.readRepository.getLatestDraftById(draftVersionId);
  }

  createReviewSession(params: { topicId: string; draftVersionId: string; reviewerId: string }) {
    return this.writeRepository.createReviewSession(params);
  }

  findReviewSession(reviewSessionId: string) {
    return this.readRepository.findReviewSession(reviewSessionId);
  }

  listReviewSessions(topicId: string) {
    return this.readRepository.listReviewSessions(topicId);
  }

  createReviewComment(params: {
    reviewSessionId: string;
    draftVersionId: string;
    sectionKey: string;
    commentMd: string;
    severity: ReviewCommentSeverity;
    actorId: string;
  }) {
    return this.writeRepository.createReviewComment(params);
  }

  listSectionComments(draftVersionId: string, sectionKey: string) {
    return this.readRepository.listSectionComments(draftVersionId, sectionKey);
  }

  updateReviewComment(
    reviewSessionId: string,
    commentId: string,
    data: { status?: ReviewCommentStatus; resolutionNote?: string },
  ) {
    return this.writeRepository.updateReviewComment(reviewSessionId, commentId, data);
  }

  submitReviewSession(reviewSessionId: string) {
    return this.writeRepository.submitReviewSession(reviewSessionId);
  }

  markDraftApproved(draftVersionId: string, actorId: string) {
    return this.writeRepository.markDraftApproved(draftVersionId, actorId);
  }

  markDraftFailed(draftVersionId: string) {
    return this.writeRepository.markDraftFailed(draftVersionId);
  }

  createUsageLog(data: Prisma.LlmUsageLogCreateInput) {
    return this.writeRepository.createUsageLog(data);
  }
}
