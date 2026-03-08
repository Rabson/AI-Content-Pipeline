import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentState, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { WorkflowService } from '@api/modules/workflow/workflow.service';
import { UserTopicOwnershipService } from '@api/modules/user/services/user-topic-ownership.service';
import { CreateReviewCommentDto } from '../dto/create-review-comment.dto';
import { CreateReviewSessionDto } from '../dto/create-review-session.dto';
import { UpdateReviewCommentDto } from '../dto/update-review-comment.dto';
import { DraftRepository } from '../draft.repository';

@Injectable()
export class DraftReviewService {
  constructor(
    private readonly repository: DraftRepository,
    private readonly workflowService: WorkflowService,
    private readonly ownershipService: UserTopicOwnershipService,
  ) {}

  async createReviewSession(draftVersionId: string, dto: CreateReviewSessionDto, actorId: string) {
    const draft = await this.repository.getLatestDraftById(draftVersionId);
    if (!draft) {
      throw new NotFoundException('Draft version not found');
    }

    const session = await this.repository.createReviewSession({
      topicId: draft.topicId,
      draftVersionId,
      reviewerId: dto.reviewerId ?? actorId,
    });

    await this.workflowService.transitionContentState({
      topicId: draft.topicId,
      stage: WorkflowStage.REVIEW,
      toState: ContentState.REVIEW_IN_PROGRESS,
      actorId,
      metadata: { draftVersionId, reviewSessionId: session.id },
    });

    return session;
  }

  async createReviewComment(reviewSessionId: string, dto: CreateReviewCommentDto, actorId: string) {
    const reviewSession = await this.getReviewSession(reviewSessionId);
    const comment = await this.repository.createReviewComment({
      reviewSessionId,
      draftVersionId: reviewSession.draftVersionId,
      sectionKey: dto.sectionKey,
      commentMd: dto.commentMd,
      severity: dto.severity,
      actorId,
    });

    await this.workflowService.recordEvent({
      topicId: reviewSession.draftVersion.topicId,
      stage: WorkflowStage.REVIEW,
      eventType: WorkflowEventType.COMMENT_CREATED,
      actorId,
      metadata: {
        reviewSessionId,
        commentId: comment.id,
        sectionKey: dto.sectionKey,
        severity: dto.severity,
      },
    });

    return comment;
  }

  async updateReviewComment(
    reviewSessionId: string,
    commentId: string,
    dto: UpdateReviewCommentDto,
    actorId: string,
  ) {
    const reviewSession = await this.getReviewSession(reviewSessionId);
    const comment = await this.repository.updateReviewComment(reviewSessionId, commentId, dto);

    await this.workflowService.recordEvent({
      topicId: reviewSession.topicId,
      stage: WorkflowStage.REVIEW,
      eventType: WorkflowEventType.COMMENT_UPDATED,
      actorId,
      metadata: {
        reviewSessionId,
        commentId,
        status: dto.status ?? comment.status,
      },
    });

    return comment;
  }

  async submitReview(reviewSessionId: string) {
    const reviewSession = await this.getReviewSession(reviewSessionId);
    const session = await this.repository.submitReviewSession(reviewSessionId);

    await this.workflowService.recordEvent({
      topicId: reviewSession.topicId,
      stage: WorkflowStage.REVIEW,
      eventType: WorkflowEventType.REVIEW_SUBMITTED,
      metadata: {
        reviewSessionId,
        commentCount: reviewSession.comments.length,
      },
    });

    return session;
  }

  async approveDraft(draftVersionId: string, actorId: string) {
    const approved = await this.repository.markDraftApproved(draftVersionId, actorId);
    await this.workflowService.markApprovedDraft(approved.topicId, draftVersionId, actorId);
    await this.ownershipService.assignDefaultOwner(approved.topicId);
    return approved;
  }

  private async getReviewSession(reviewSessionId: string) {
    const reviewSession = await this.repository.findReviewSession(reviewSessionId);
    if (!reviewSession) {
      throw new NotFoundException('Review session not found');
    }

    return reviewSession;
  }
}
