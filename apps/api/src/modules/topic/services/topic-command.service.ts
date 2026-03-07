import { Injectable } from '@nestjs/common';
import { ApproveTopicDto } from '../dto/approve-topic.dto';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { RejectTopicDto } from '../dto/reject-topic.dto';
import { ScoreTopicDto } from '../dto/score-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { TopicIntakeCommandService } from './topic-intake-command.service';
import { TopicReviewCommandService } from './topic-review-command.service';

@Injectable()
export class TopicCommandService {
  constructor(
    private readonly topicIntakeCommandService: TopicIntakeCommandService,
    private readonly topicReviewCommandService: TopicReviewCommandService,
  ) {}

  async createTopic(dto: CreateTopicDto, actorId: string) {
    return this.topicIntakeCommandService.createTopic(dto, actorId);
  }

  async updateTopic(topicId: string, dto: UpdateTopicDto) {
    return this.topicIntakeCommandService.updateTopic(topicId, dto);
  }

  async submitTopic(topicId: string, actorId: string, note?: string) {
    return this.topicIntakeCommandService.submitTopic(topicId, actorId, note);
  }

  async scoreTopic(topicId: string, dto: ScoreTopicDto, actorId: string) {
    return this.topicReviewCommandService.scoreTopic(topicId, dto, actorId);
  }

  async approveTopic(topicId: string, dto: ApproveTopicDto, actorId: string) {
    return this.topicReviewCommandService.approveTopic(topicId, dto, actorId);
  }

  async rejectTopic(topicId: string, dto: RejectTopicDto, actorId: string) {
    return this.topicReviewCommandService.rejectTopic(topicId, dto, actorId);
  }

  async handoffToResearch(topicId: string, actorId: string, traceId?: string) {
    return this.topicReviewCommandService.handoffToResearch(topicId, actorId, traceId);
  }
}
