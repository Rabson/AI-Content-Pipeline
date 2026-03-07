import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { markOutlineFailed } from './outline-error.helper';
import { findTopicById, getLatestResearch, getNextVersion, latestOutline, outlineByVersion } from './outline-read.helper';
import { persistGeneratedOutline } from './outline-write.helper';
import type { PersistGeneratedOutlineParams } from './outline-write.types';

@Injectable()
export class OutlineRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicById(topicId: string) {
    return findTopicById(this.prisma, topicId);
  }

  latestOutline(topicId: string) {
    return latestOutline(this.prisma, topicId);
  }

  outlineByVersion(topicId: string, versionNumber: number) {
    return outlineByVersion(this.prisma, topicId, versionNumber);
  }

  getNextVersion(topicId: string) {
    return getNextVersion(this.prisma, topicId);
  }

  getLatestResearch(topicId: string) {
    return getLatestResearch(this.prisma, topicId);
  }

  async persistGeneratedOutline(params: PersistGeneratedOutlineParams) {
    const nextVersion = await this.getNextVersion(params.topicId);
    const topic = await this.findTopicById(params.topicId);
    if (!topic) throw new NotFoundException('Topic not found');
    return persistGeneratedOutline(this.prisma, params, nextVersion, topic.contentItemId ?? undefined);
  }

  markFailed(topicId: string, error: string) {
    return markOutlineFailed(this.prisma, topicId, error);
  }
}
