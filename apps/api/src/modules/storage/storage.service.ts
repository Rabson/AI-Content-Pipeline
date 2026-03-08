import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageObjectPurpose, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { AuthenticatedUser } from '@api/common/interfaces/authenticated-request.interface';
import { env } from '@api/config/env';
import { UserTopicOwnershipService } from '../user/services/user-topic-ownership.service';
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
    private readonly ownershipService: UserTopicOwnershipService,
  ) {}

  async listTopicAssets(topicId: string, actor: AuthenticatedUser) {
    const topic = await this.getTopicOrThrow(topicId);
    await this.ownershipService.assertPublishAccess(actor, topic.ownerUserId ?? null);
    return this.repository.listTopicAssets(topicId);
  }

  async createUploadUrl(topicId: string, dto: CreateUploadUrlDto, actor: AuthenticatedUser) {
    const topic = await this.getTopicOrThrow(topicId);
    await this.ownershipService.assertPublishAccess(actor, topic.ownerUserId ?? null);
    const bucket = this.storageSigningService.getBucketOrThrow();
    this.storageSigningService.validateUploadInput(dto.filename, dto.mimeType, dto.sizeBytes);
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
      sizeBytes: dto.sizeBytes,
      purpose: dto.purpose ?? StorageObjectPurpose.ATTACHMENT,
      createdBy: actor.id,
    });

    await this.recordStorageEvent(
      topicId,
      object.id,
      objectKey,
      dto.purpose ?? StorageObjectPurpose.ATTACHMENT,
      actor.id,
    );

    return {
      storageObjectId: object.id,
      bucket,
      objectKey,
      uploadUrl,
      publicUrl,
      maxBytes: env.storageMaxUploadBytes,
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
