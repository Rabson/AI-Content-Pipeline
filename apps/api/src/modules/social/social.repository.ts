import { Injectable } from '@nestjs/common';
import { SocialPlatform, SocialPostStatus } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';
import { findTopicById, getLatestDraft, getSocialPostOrThrow, latestLinkedInDraft, nextVersion } from './social-read.helper';
import { applyStatus, persistGeneratedLinkedInDraft } from './social-write.helper';
import type { PersistGeneratedLinkedInDraftParams } from './social.repository.types';
import { toSocialView } from './social-view.helper';

@Injectable()
export class SocialRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicById(topicId: string) { return findTopicById(this.prisma, topicId); }
  getLatestDraft(topicId: string) { return getLatestDraft(this.prisma, topicId); }
  latestLinkedInDraft(topicId: string) { return latestLinkedInDraft(this.prisma, topicId); }
  getSocialPostOrThrow(id: string) { return getSocialPostOrThrow(this.prisma, id); }
  nextVersion(topicId: string, platform: SocialPlatform) { return nextVersion(this.prisma, topicId, platform); }
  persistGeneratedLinkedInDraft(params: PersistGeneratedLinkedInDraftParams) {
    return persistGeneratedLinkedInDraft(this.prisma, params);
  }
  applyStatus(id: string, status: SocialPostStatus, externalUrl?: string, error?: string | null) {
    return applyStatus(this.prisma, id, status, externalUrl, error);
  }
  toView(post: Awaited<ReturnType<SocialRepository['latestLinkedInDraft']>>) { return toSocialView(post); }
}
