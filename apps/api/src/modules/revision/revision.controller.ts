import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { GetDiffQueryDto } from './dto/get-diff-query.dto';
import { RunRevisionDto } from './dto/run-revision.dto';
import { RevisionService } from './revision.service';

@Roles(AppRole.EDITOR)
@Controller('v1')
export class RevisionController {
  constructor(private readonly revisionService: RevisionService) {}

  @Roles(AppRole.REVIEWER)
  @Post('reviews/:reviewSessionId/revisions/run')
  runRevision(
    @Param('reviewSessionId') reviewSessionId: string,
    @Body() dto: RunRevisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.revisionService.enqueueRevision(reviewSessionId, dto, this.actorId(req));
  }

  @Get('revisions/:revisionRunId')
  getRevisionRun(@Param('revisionRunId') revisionRunId: string) {
    return this.revisionService.getRevisionRun(revisionRunId);
  }

  @Get('topics/:topicId/revisions')
  listRevisionRuns(@Param('topicId') topicId: string) {
    return this.revisionService.listRevisionRuns(topicId);
  }

  @Get('revisions/:revisionRunId/diff')
  getRevisionDiff(@Param('revisionRunId') revisionRunId: string) {
    return this.revisionService.getRevisionDiff(revisionRunId);
  }

  @Get('topics/:topicId/drafts/compare')
  compareDraftVersions(@Param('topicId') topicId: string, @Query() query: GetDiffQueryDto) {
    return this.revisionService.compareDraftVersions(topicId, query);
  }

  private actorId(req: AuthenticatedRequest): string {
    return req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
  }
}
