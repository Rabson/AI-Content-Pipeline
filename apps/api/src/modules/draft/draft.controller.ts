import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CreateReviewCommentDto } from './dto/create-review-comment.dto';
import { CreateReviewSessionDto } from './dto/create-review-session.dto';
import { GenerateDraftDto } from './dto/generate-draft.dto';
import { GetDraftQueryDto } from './dto/get-draft-query.dto';
import { ListDraftVersionsDto } from './dto/list-draft-versions.dto';
import { UpdateReviewCommentDto } from './dto/update-review-comment.dto';
import { DraftService } from './draft.service';
import { UserTopicOwnershipService } from '../user/services/user-topic-ownership.service';

@Controller('v1')
export class DraftController {
  constructor(
    private readonly draftService: DraftService,
    private readonly ownershipService: UserTopicOwnershipService,
  ) {}

  @Roles(AppRole.EDITOR)
  @Post('topics/:topicId/drafts/generate')
  generateDraft(
    @Param('topicId') topicId: string,
    @Body() dto: GenerateDraftDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.draftService.enqueueDraftGeneration(topicId, dto, this.actorId(req));
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get('topics/:topicId/drafts')
  async listDrafts(@Param('topicId') topicId: string, @Query() query: ListDraftVersionsDto, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.draftService.listDraftVersions(topicId, query);
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get('topics/:topicId/drafts/current')
  async getCurrentDraft(@Param('topicId') topicId: string, @Query() query: GetDraftQueryDto, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.draftService.getDraft(topicId, query);
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get('topics/:topicId/drafts/current/markdown')
  async getDraftMarkdown(@Param('topicId') topicId: string, @Query() query: GetDraftQueryDto, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.draftService.getDraftMarkdown(topicId, query);
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get('topics/:topicId/draft/sections/:sectionKey')
  async getDraftSection(
    @Param('topicId') topicId: string,
    @Param('sectionKey') sectionKey: string,
    @Query() query: GetDraftQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.draftService.getDraftSection(topicId, sectionKey, query);
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get('topics/:topicId/reviews')
  async listReviewSessions(@Param('topicId') topicId: string, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.draftService.listReviewSessions(topicId);
  }

  @Roles(AppRole.EDITOR)
  @Post('drafts/:draftVersionId/reviews')
  createReviewSession(
    @Param('draftVersionId') draftVersionId: string,
    @Body() dto: CreateReviewSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.draftService.createReviewSession(draftVersionId, dto, this.actorId(req));
  }

  @Roles(AppRole.REVIEWER)
  @Post('reviews/:reviewSessionId/comments')
  createReviewComment(
    @Param('reviewSessionId') reviewSessionId: string,
    @Body() dto: CreateReviewCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.draftService.createReviewComment(reviewSessionId, dto, this.actorId(req));
  }

  @Roles(AppRole.REVIEWER)
  @Patch('reviews/:reviewSessionId/comments/:commentId')
  updateReviewComment(
    @Param('reviewSessionId') reviewSessionId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateReviewCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.draftService.updateReviewComment(reviewSessionId, commentId, dto, this.actorId(req));
  }

  @Roles(AppRole.REVIEWER)
  @Post('reviews/:reviewSessionId/submit')
  submitReview(@Param('reviewSessionId') reviewSessionId: string) {
    return this.draftService.submitReview(reviewSessionId);
  }

  @Roles(AppRole.REVIEWER)
  @Post('drafts/:draftVersionId/approve')
  approveDraft(@Param('draftVersionId') draftVersionId: string, @Req() req: AuthenticatedRequest) {
    return this.draftService.approveDraft(draftVersionId, this.actorId(req));
  }

  private actorId(req: AuthenticatedRequest): string {
    return req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
  }
}
