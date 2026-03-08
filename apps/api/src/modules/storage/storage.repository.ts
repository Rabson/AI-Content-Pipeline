import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StorageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicById(topicId: string) {
    return this.prisma.topic.findFirst({
      where: { id: topicId, deletedAt: null },
      include: { contentItem: true },
    });
  }

  createStorageObject(data: {
    topicId?: string;
    contentItemId?: string;
    provider: string;
    bucket: string;
    objectKey: string;
    publicUrl?: string;
    mimeType?: string;
    sizeBytes?: number;
    purpose: any;
    createdBy?: string;
  }) {
    return this.prisma.storageObject.create({
      data,
    });
  }
}
