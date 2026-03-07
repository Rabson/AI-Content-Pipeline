import { Injectable } from '@nestjs/common';
import { GenerateDraftDto } from './dto/generate-draft.dto';
import { GetDraftQueryDto } from './dto/get-draft-query.dto';
import { ListDraftVersionsDto } from './dto/list-draft-versions.dto';
import { UpdateReviewCommentDto } from './dto/update-review-comment.dto';
import { CreateReviewCommentDto } from './dto/create-review-comment.dto';
import { CreateReviewSessionDto } from './dto/create-review-session.dto';
import { DraftGenerationService } from './services/draft-generation.service';
import { DraftQueryService } from './services/draft-query.service';
import { DraftReviewService } from './services/draft-review.service';

@Injectable()
export class DraftService {
  constructor(
    private readonly draftGenerationService: DraftGenerationService,
    private readonly draftQueryService: DraftQueryService,
    private readonly draftReviewService: DraftReviewService,
  ) {}

  async enqueueDraftGeneration(topicId: string, dto: GenerateDraftDto, actorId: string) {
    return this.draftGenerationService.enqueueDraftGeneration(topicId, dto, actorId);
  }

  async listDraftVersions(topicId: string, query: ListDraftVersionsDto) {
    return this.draftQueryService.listDraftVersions(topicId, query);
  }

  async getDraft(topicId: string, query: GetDraftQueryDto) {
    return this.draftQueryService.getDraft(topicId, query);
  }

  async getDraftMarkdown(topicId: string, query: GetDraftQueryDto) {
    return this.draftQueryService.getDraftMarkdown(topicId, query);
  }

  async getDraftSection(topicId: string, sectionKey: string, query: GetDraftQueryDto) {
    return this.draftQueryService.getDraftSection(topicId, sectionKey, query);
  }

  listReviewSessions(topicId: string) {
    return this.draftQueryService.listReviewSessions(topicId);
  }

  async createReviewSession(draftVersionId: string, dto: CreateReviewSessionDto, actorId: string) {
    return this.draftReviewService.createReviewSession(draftVersionId, dto, actorId);
  }

  async createReviewComment(reviewSessionId: string, dto: CreateReviewCommentDto, actorId: string) {
    return this.draftReviewService.createReviewComment(reviewSessionId, dto, actorId);
  }

  async updateReviewComment(
    reviewSessionId: string,
    commentId: string,
    dto: UpdateReviewCommentDto,
    actorId: string,
  ) {
    return this.draftReviewService.updateReviewComment(reviewSessionId, commentId, dto, actorId);
  }

  async submitReview(reviewSessionId: string) {
    return this.draftReviewService.submitReview(reviewSessionId);
  }

  async approveDraft(draftVersionId: string, actorId: string) {
    return this.draftReviewService.approveDraft(draftVersionId, actorId);
  }
}
