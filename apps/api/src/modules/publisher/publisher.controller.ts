import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { PublishDevtoDto } from './dto/publish-devto.dto';
import { PublisherService } from './publisher.service';

@Roles(AppRole.REVIEWER)
@Controller('v1/topics/:topicId/publications')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Get()
  list(@Param('topicId') topicId: string) {
    return this.publisherService.listPublications(topicId);
  }

  @Post('devto')
  publishDevto(
    @Param('topicId') topicId: string,
    @Body() dto: PublishDevtoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.publisherService.enqueueDevtoPublish(topicId, dto, actorId);
  }
}
