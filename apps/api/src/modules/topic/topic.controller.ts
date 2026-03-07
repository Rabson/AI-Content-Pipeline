import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { SubmitTopicDto } from './dto/submit-topic.dto';
import { ScoreTopicDto } from './dto/score-topic.dto';
import { ApproveTopicDto } from './dto/approve-topic.dto';
import { RejectTopicDto } from './dto/reject-topic.dto';
import { HandoffResearchDto } from './dto/handoff-research.dto';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
import { TopicService } from './topic.service';

@Roles(AppRole.EDITOR)
@Controller('v1/topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  create(@Body() dto: CreateTopicDto, @Req() req: AuthenticatedRequest) {
    const actorId = this.actorId(req);
    return this.topicService.createTopic(dto, actorId);
  }

  @Get()
  list(@Query() query: ListTopicsQueryDto) {
    return this.topicService.listTopics(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.topicService.getTopic(id);
  }

  @Get(':id/status-history')
  statusHistory(@Param('id') id: string) {
    return this.topicService.getStatusHistory(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.topicService.updateTopic(id, dto);
  }

  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitTopicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.topicService.submitTopic(id, this.actorId(req), dto.note);
  }

  @Roles(AppRole.REVIEWER)
  @Post(':id/score')
  score(@Param('id') id: string, @Body() dto: ScoreTopicDto, @Req() req: AuthenticatedRequest) {
    return this.topicService.scoreTopic(id, dto, this.actorId(req));
  }

  @Roles(AppRole.REVIEWER)
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveTopicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.topicService.approveTopic(id, dto, this.actorId(req));
  }

  @Roles(AppRole.REVIEWER)
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectTopicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.topicService.rejectTopic(id, dto, this.actorId(req));
  }

  @Post(':id/handoff-research')
  handoffResearch(
    @Param('id') id: string,
    @Body() dto: HandoffResearchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.topicService.handoffToResearch(id, this.actorId(req), dto.traceId);
  }

  private actorId(req: AuthenticatedRequest): string {
    return req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
  }
}
