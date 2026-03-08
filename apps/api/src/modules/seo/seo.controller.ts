import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { SeoService } from './seo.service';
import { UserTopicOwnershipService } from '../user/services/user-topic-ownership.service';

@Controller('v1/topics/:topicId/seo')
export class SeoController {
  constructor(
    private readonly seoService: SeoService,
    private readonly ownershipService: UserTopicOwnershipService,
  ) {}

  @Roles(AppRole.EDITOR)
  @Post('generate')
  generate(
    @Param('topicId') topicId: string,
    @Body() dto: GenerateSeoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.seoService.enqueue(topicId, dto, actorId);
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get()
  async latest(@Param('topicId') topicId: string, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.seoService.getLatest(topicId);
  }
}
