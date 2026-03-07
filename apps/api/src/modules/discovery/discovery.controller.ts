import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CreateDiscoveryTopicDto } from './dto/create-discovery-topic.dto';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';
import { ImportDiscoveryTopicsDto } from './dto/import-discovery-topics.dto';
import { ListDiscoveryCandidatesQueryDto } from './dto/list-discovery-candidates-query.dto';
import { DiscoveryService } from './discovery.service';

@Roles(AppRole.EDITOR)
@Controller('v1/discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('suggestions')
  suggestions(@Query() query: DiscoveryQueryDto) {
    return this.discoveryService.suggest(query);
  }

  @Get('candidates')
  candidates(@Query() query: ListDiscoveryCandidatesQueryDto) {
    return this.discoveryService.listCandidates(query);
  }

  @Post('topics/manual')
  createManualTopic(
    @Body() dto: CreateDiscoveryTopicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.discoveryService.createManualCandidate(dto, this.actorId(req));
  }

  @Post('topics/import')
  importTopics(@Body() dto: ImportDiscoveryTopicsDto, @Req() req: AuthenticatedRequest) {
    return this.discoveryService.enqueueImport(dto, this.actorId(req));
  }

  private actorId(req: AuthenticatedRequest): string {
    return req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
  }
}
