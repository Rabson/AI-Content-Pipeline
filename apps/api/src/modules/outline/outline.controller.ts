import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GetOutlineQueryDto } from './dto/get-outline-query.dto';
import { OutlineService } from './outline.service';

@Roles(AppRole.EDITOR)
@Controller('v1/topics/:topicId/outline')
export class OutlineController {
  constructor(private readonly outlineService: OutlineService) {}

  @Post('generate')
  generate(
    @Param('topicId') topicId: string,
    @Body() dto: GenerateOutlineDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.outlineService.enqueue(topicId, dto, this.actorId(req));
  }

  @Get()
  get(@Param('topicId') topicId: string, @Query() query: GetOutlineQueryDto) {
    return this.outlineService.getOutline(topicId, query);
  }

  private actorId(req: AuthenticatedRequest): string {
    return req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
  }
}
