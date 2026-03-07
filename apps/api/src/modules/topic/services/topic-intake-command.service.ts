import { BadRequestException, Injectable } from '@nestjs/common';
import { TopicStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { WorkflowService } from '../../workflow/workflow.service';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { TopicRepository } from '../topic.repository';
import { TopicStatusMachine } from '../topic.status-machine';
import { normalizeTopicTags, slugifyTopicTitle } from '../utils/topic-normalization.util';
import { TopicQueryService } from './topic-query.service';

@Injectable()
export class TopicIntakeCommandService {
  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly topicQueryService: TopicQueryService,
    private readonly statusMachine: TopicStatusMachine,
    private readonly workflowService: WorkflowService,
  ) {}

  async createTopic(dto: CreateTopicDto, actorId: string) {
    const topic = await this.topicRepository.create({
      title: dto.title,
      slug: slugifyTopicTitle(dto.title),
      brief: dto.brief,
      audience: dto.audience,
      createdBy: actorId,
      tags: this.buildTags(dto.tags),
    });

    await this.workflowService.ensureContentItemForTopic(topic.id);
    await this.workflowService.recordEvent({
      topicId: topic.id,
      stage: WorkflowStage.TOPIC,
      eventType: WorkflowEventType.TOPIC_CREATED,
      actorId,
      metadata: { title: topic.title },
    });

    return topic;
  }

  async updateTopic(topicId: string, dto: UpdateTopicDto) {
    const topic = await this.topicQueryService.getTopic(topicId);
    this.assertEditable(topic.status);

    return this.topicRepository.update(topicId, {
      title: dto.title,
      slug: dto.title ? slugifyTopicTitle(dto.title) : undefined,
      brief: dto.brief,
      audience: dto.audience,
    });
  }

  async submitTopic(topicId: string, actorId: string, note?: string) {
    const topic = await this.topicQueryService.getTopic(topicId);
    this.statusMachine.assertTransition(topic.status, TopicStatus.SUBMITTED);

    const updated = await this.topicRepository.transitionStatus({
      topicId,
      fromStatus: topic.status,
      toStatus: TopicStatus.SUBMITTED,
      actorId,
      reason: note,
    });

    await this.workflowService.syncTopicStatus({
      topicId,
      topicStatus: TopicStatus.SUBMITTED,
      stage: WorkflowStage.TOPIC,
      actorId,
    });

    return updated;
  }

  private buildTags(tags?: string[]) {
    const normalizedTags = normalizeTopicTags(tags);
    if (!normalizedTags.length) {
      return undefined;
    }

    return {
      createMany: {
        data: normalizedTags.map((tag) => ({ tag })),
        skipDuplicates: true,
      },
    };
  }

  private assertEditable(status: TopicStatus) {
    if (status === TopicStatus.DRAFT || status === TopicStatus.REJECTED) {
      return;
    }

    throw new BadRequestException('Only draft/rejected topics can be edited');
  }
}
