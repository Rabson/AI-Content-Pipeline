import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowEventType, WorkflowStage } from '@prisma/client';
import { UserAccountService } from '../../user/services/user-account.service';
import { WorkflowService } from '../../workflow/workflow.service';
import { UpdateTopicBannerImageDto } from '../dto/update-topic-banner-image.dto';
import { TopicRepository } from '../topic.repository';
import { TopicQueryService } from './topic-query.service';

@Injectable()
export class TopicPublishCommandService {
  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly topicQueryService: TopicQueryService,
    private readonly workflowService: WorkflowService,
    private readonly userAccountService: UserAccountService,
  ) {}

  async assignOwner(topicId: string, ownerUserId: string, actorId: string) {
    await this.topicQueryService.getTopic(topicId);
    await this.userAccountService.getUser(ownerUserId);
    const updated = await this.topicRepository.assignOwner(topicId, ownerUserId);
    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.TOPIC,
      eventType: WorkflowEventType.TRANSITION,
      actorId,
      metadata: { ownerUserId },
    });
    return updated;
  }

  async updateBannerImage(topicId: string, dto: UpdateTopicBannerImageDto, actorId: string) {
    await this.topicQueryService.getTopic(topicId);
    const storageObjectId = dto.storageObjectId?.trim() || null;
    if (!storageObjectId) {
      return this.persistBanner(topicId, null, dto.alt, dto.caption, actorId);
    }

    const object = await this.topicRepository.findStorageObjectForTopic(topicId, storageObjectId);
    if (!object) throw new NotFoundException('Storage object not found for topic');
    if (!object.mimeType?.startsWith('image/')) {
      throw new BadRequestException('Banner image must be an uploaded image asset');
    }

    return this.persistBanner(topicId, object.id, dto.alt, dto.caption, actorId);
  }

  private async persistBanner(
    topicId: string,
    storageObjectId: string | null,
    alt: string | undefined,
    caption: string | undefined,
    actorId: string,
  ) {
    const updated = await this.topicRepository.updateBannerImage(topicId, {
      storageObjectId,
      alt: alt?.trim() || null,
      caption: caption?.trim() || null,
    });

    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.PUBLISH,
      eventType: WorkflowEventType.TRANSITION,
      actorId,
      metadata: {
        bannerImageStorageObjectId: storageObjectId,
        bannerImageAlt: alt?.trim() || null,
        bannerImageCaption: caption?.trim() || null,
      },
    });

    return updated;
  }
}
