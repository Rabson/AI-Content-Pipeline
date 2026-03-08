import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GetOutlineQueryDto } from './dto/get-outline-query.dto';
import { OutlineService } from './outline.service';
import { UserTopicOwnershipService } from '../user/services/user-topic-ownership.service';

@Controller('v1/topics/:topicId/outline')
export class OutlineController {
  constructor(
    private readonly outlineService: OutlineService,
    private readonly ownershipService: UserTopicOwnershipService,
  ) {}

  @Roles(AppRole.EDITOR)
  @Post('generate')
  generate(
    @Param('topicId') topicId: string,
    @Body() dto: GenerateOutlineDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.outlineService.enqueue(topicId, dto, this.actorId(req));
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get()
  async get(@Param('topicId') topicId: string, @Query() query: GetOutlineQueryDto, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.outlineService.getOutline(topicId, query);
  }

  private actorId(req: AuthenticatedRequest): string {
    return req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
  }
}
