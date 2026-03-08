import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { AddSourceDto } from './dto/add-source.dto';
import { ResearchQueryDto } from './dto/research-query.dto';
import { RunResearchDto } from './dto/run-research.dto';
import { ResearchService } from './research.service';
import { UserTopicOwnershipService } from '../user/services/user-topic-ownership.service';

@Controller('v1/topics/:topicId/research')
export class ResearchController {
  constructor(
    private readonly researchService: ResearchService,
    private readonly ownershipService: UserTopicOwnershipService,
  ) {}

  @Roles(AppRole.EDITOR)
  @Post('run')
  run(
    @Param('topicId') topicId: string,
    @Body() dto: RunResearchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.researchService.enqueue(topicId, dto, this.actorId(req));
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get()
  async latest(@Param('topicId') topicId: string, @Query() query: ResearchQueryDto, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.researchService.getLatest(topicId, query);
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get('versions')
  async versions(@Param('topicId') topicId: string, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.researchService.listVersions(topicId);
  }

  @Roles(AppRole.REVIEWER)
  @Post('sources')
  addSource(@Param('topicId') topicId: string, @Body() dto: AddSourceDto) {
    return this.researchService.addManualSource(topicId, dto);
  }

  private actorId(req: AuthenticatedRequest): string {
    return req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
  }
}
