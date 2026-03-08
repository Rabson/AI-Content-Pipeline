import { Injectable } from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
import { ScoreTopicDto } from './dto/score-topic.dto';
import { ApproveTopicDto } from './dto/approve-topic.dto';
import { RejectTopicDto } from './dto/reject-topic.dto';
import { AssignTopicOwnerDto } from './dto/assign-topic-owner.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { UpdateTopicBannerImageDto } from './dto/update-topic-banner-image.dto';
import { TopicCommandService } from './services/topic-command.service';
import { TopicQueryService } from './services/topic-query.service';

@Injectable()
export class TopicService {
  constructor(
    private readonly topicQueryService: TopicQueryService,
    private readonly topicCommandService: TopicCommandService,
  ) {}

  async createTopic(dto: CreateTopicDto, actorId: string) {
    return this.topicCommandService.createTopic(dto, actorId);
  }

  async listTopics(query: ListTopicsQueryDto, actor?: AuthenticatedUser) {
    return this.topicQueryService.listTopics(query, actor);
  }

  async getTopic(topicId: string) {
    return this.topicQueryService.getTopic(topicId);
  }

  async getStatusHistory(topicId: string) {
    return this.topicQueryService.getStatusHistory(topicId);
  }

  async updateTopic(topicId: string, dto: UpdateTopicDto) {
    return this.topicCommandService.updateTopic(topicId, dto);
  }

  async submitTopic(topicId: string, actorId: string, note?: string) {
    return this.topicCommandService.submitTopic(topicId, actorId, note);
  }

  async scoreTopic(topicId: string, dto: ScoreTopicDto, actorId: string) {
    return this.topicCommandService.scoreTopic(topicId, dto, actorId);
  }

  async approveTopic(topicId: string, dto: ApproveTopicDto, actorId: string) {
    return this.topicCommandService.approveTopic(topicId, dto, actorId);
  }

  async rejectTopic(topicId: string, dto: RejectTopicDto, actorId: string) {
    return this.topicCommandService.rejectTopic(topicId, dto, actorId);
  }

  async handoffToResearch(topicId: string, actorId: string, traceId?: string) {
    return this.topicCommandService.handoffToResearch(topicId, actorId, traceId);
  }

  async assignOwner(topicId: string, dto: AssignTopicOwnerDto, actorId: string) {
    return this.topicCommandService.assignOwner(topicId, dto.ownerUserId, actorId);
  }

  async updateBannerImage(topicId: string, dto: UpdateTopicBannerImageDto, actorId: string) {
    return this.topicCommandService.updateBannerImage(topicId, dto, actorId);
  }
}
