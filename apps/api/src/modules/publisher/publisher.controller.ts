import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RequestRateLimitService } from '../../common/security/request-rate-limit.service';
import { RequestPublicationDto } from './dto/request-publication.dto';
import { PublisherService } from './publisher.service';

@Roles(AppRole.USER)
@Controller('v1/topics/:topicId/publications')
export class PublisherController {
  constructor(
    private readonly publisherService: PublisherService,
    private readonly rateLimitService: RequestRateLimitService,
  ) {}

  @Get()
  list(@Param('topicId') topicId: string, @Req() req: AuthenticatedRequest) {
    return this.publisherService.listPublications(topicId, req.user);
  }

  @Get('options')
  options(@Param('topicId') topicId: string, @Req() req: AuthenticatedRequest) {
    return this.publisherService.getPublicationOptions(topicId, req.user!);
  }

  @Post()
  publish(@Param('topicId') topicId: string, @Body() dto: RequestPublicationDto, @Req() req: AuthenticatedRequest) {
    this.rateLimitService.enforce(`publish:${req.ip}:${req.user?.id ?? 'anonymous'}:${topicId}`, 3, 60_000);
    return this.publisherService.enqueuePublication(topicId, dto, req.user!);
  }

  @Post(':publicationId/retry')
  retry(@Param('topicId') topicId: string, @Param('publicationId') publicationId: string, @Req() req: AuthenticatedRequest) {
    this.rateLimitService.enforce(`publish-retry:${req.ip}:${req.user?.id ?? 'anonymous'}:${publicationId}`, 3, 60_000);
    return this.publisherService.retryPublication(topicId, publicationId, req.user!);
  }
}
