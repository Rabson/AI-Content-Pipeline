import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageObjectPurpose, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { env } from '../../config/env';
import { WorkflowService } from '../workflow/workflow.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { StorageRepository } from './storage.repository';
import { StorageSigningService } from './services/storage-signing.service';

@Injectable()
export class StorageService {
  constructor(
    private readonly repository: StorageRepository,
    private readonly workflowService: WorkflowService,
    private readonly storageSigningService: StorageSigningService,
  ) {}

  async createUploadUrl(topicId: string, dto: CreateUploadUrlDto, actorId: string) {
    const topic = await this.getTopicOrThrow(topicId);
    const bucket = this.storageSigningService.getBucketOrThrow();
    const objectKey = this.storageSigningService.buildObjectKey(topicId, dto.filename);
    const uploadUrl = await this.storageSigningService.signUploadUrl(bucket, objectKey, dto.mimeType);
    const publicUrl = this.storageSigningService.buildPublicUrl(objectKey);
    const object = await this.repository.createStorageObject({
      topicId,
      contentItemId: topic.contentItemId ?? undefined,
      provider: env.storageProvider,
      bucket,
      objectKey,
      publicUrl,
      mimeType: dto.mimeType,
      purpose: dto.purpose ?? StorageObjectPurpose.ATTACHMENT,
      createdBy: actorId,
    });

    await this.recordStorageEvent(topicId, object.id, objectKey, dto.purpose ?? StorageObjectPurpose.ATTACHMENT, actorId);

    return {
      storageObjectId: object.id,
      bucket,
      objectKey,
      uploadUrl,
      publicUrl,
      expiresInSeconds: 900,
    };
  }

  private async getTopicOrThrow(topicId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  private async recordStorageEvent(
    topicId: string,
    storageObjectId: string,
    objectKey: string,
    purpose: StorageObjectPurpose,
    actorId: string,
  ) {
    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.PUBLISH,
      eventType: WorkflowEventType.ENQUEUED,
      actorId,
      metadata: { storageObjectId, objectKey, purpose },
    });
  }
}
