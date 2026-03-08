import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { GenerateLinkedInDto } from './dto/generate-linkedin.dto';
import { UpdateSocialPostStatusDto } from './dto/update-social-post-status.dto';
import { SocialService } from './social.service';
import { UserTopicOwnershipService } from '../user/services/user-topic-ownership.service';

@Controller('v1')
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly ownershipService: UserTopicOwnershipService,
  ) {}

  @Roles(AppRole.EDITOR)
  @Post('topics/:topicId/social/linkedin/generate')
  generate(
    @Param('topicId') topicId: string,
    @Body() dto: GenerateLinkedInDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.socialService.enqueueLinkedIn(topicId, dto, actorId);
  }

  @Roles(AppRole.USER, AppRole.EDITOR)
  @Get('topics/:topicId/social/linkedin')
  async latest(@Param('topicId') topicId: string, @Req() req: AuthenticatedRequest) {
    await this.ownershipService.assertTopicReadAccess(req.user, topicId);
    return this.socialService.getLatestLinkedIn(topicId);
  }

  @Roles(AppRole.REVIEWER)
  @Patch('social-posts/:id/status')
  updateStatus(
    @Param('id') socialPostId: string,
    @Body() dto: UpdateSocialPostStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.socialService.updateStatus(socialPostId, dto, actorId);
  }
}
