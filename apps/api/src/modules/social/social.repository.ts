import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SocialPlatform, SocialPostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { estimateLlmCostUsd } from '../../common/llm/usage-cost.util';

@Injectable()
export class SocialRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicById(topicId: string) {
    return this.prisma.topic.findFirst({
      where: { id: topicId, deletedAt: null },
      include: { contentItem: true },
    });
  }

  getLatestDraft(topicId: string) {
    return this.prisma.draftVersion.findFirst({
      where: { topicId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  latestLinkedInDraft(topicId: string) {
    return this.prisma.socialPost.findFirst({
      where: { topicId, platform: SocialPlatform.LINKEDIN },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });
  }

  getSocialPostOrThrow(id: string) {
    return this.prisma.socialPost.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNumber: 'desc' } } },
    }).then((post) => {
      if (!post) {
        throw new NotFoundException('Social post not found');
      }

      return post;
    });
  }

  async nextVersion(topicId: string, platform: SocialPlatform) {
    const post = await this.prisma.socialPost.findFirst({
      where: { topicId, platform },
      select: { latestVersionNumber: true },
    });

    return (post?.latestVersionNumber ?? 0) + 1;
  }

  async persistGeneratedLinkedInDraft(params: {
    topicId: string;
    payload: {
      platform: 'LINKEDIN';
      headline: string;
      post: string;
      hashtags: string[];
      callToAction: string;
    };
    model: string;
    promptHash: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }) {
    const topic = await this.findTopicById(params.topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const socialPost = await this.ensureLinkedInPost(tx, params.topicId, topic.contentItemId ?? undefined);
      const versionNumber = socialPost.latestVersionNumber + 1;
      const version = await this.createLinkedInVersion(tx, socialPost.id, versionNumber, params);
      const updatedPost = await this.markLatestVersion(tx, socialPost.id, versionNumber);
      await this.persistUsageLog(tx, params, topic.contentItemId ?? undefined);
      return {
        ...updatedPost,
        versions: [version],
      };
    });
  }

  async applyStatus(id: string, status: SocialPostStatus, externalUrl?: string, error?: string | null) {
    const post = await this.getSocialPostOrThrow(id);
    const latestVersionNumber = post.latestVersionNumber || post.versions[0]?.versionNumber || 0;

    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status,
        externalUrl: externalUrl ?? post.externalUrl,
        postedAt: status === SocialPostStatus.POSTED ? new Date() : post.postedAt,
        approvedVersionNumber: status === SocialPostStatus.APPROVED ? latestVersionNumber : post.approvedVersionNumber,
        postedVersionNumber: status === SocialPostStatus.POSTED ? latestVersionNumber : post.postedVersionNumber,
        error: error ?? null,
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });
  }

  toView(post: Awaited<ReturnType<SocialRepository['latestLinkedInDraft']>>) {
    if (!post) {
      return null;
    }

    const version = post.versions[0];
    return {
      id: post.id,
      platform: post.platform,
      status: post.status,
      headline: version?.headline ?? '',
      post: version?.bodyText ?? '',
      hashtags: version?.hashtags ?? [],
      callToAction: version?.cta ?? '',
      latestVersionNumber: post.latestVersionNumber,
      approvedVersionNumber: post.approvedVersionNumber,
      postedVersionNumber: post.postedVersionNumber,
      externalUrl: post.externalUrl,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private async ensureLinkedInPost(
    tx: Prisma.TransactionClient,
    topicId: string,
    contentItemId?: string,
  ) {
    const existing = await tx.socialPost.findFirst({
      where: { topicId, platform: SocialPlatform.LINKEDIN },
    });

    if (existing) {
      return existing;
    }

    return tx.socialPost.create({
      data: {
        topicId,
        contentItemId,
        platform: SocialPlatform.LINKEDIN,
        status: SocialPostStatus.DRAFT,
      },
    });
  }

  private createLinkedInVersion(
    tx: Prisma.TransactionClient,
    socialPostId: string,
    versionNumber: number,
    params: {
      payload: {
        headline: string;
        post: string;
        hashtags: string[];
        callToAction: string;
      };
      model: string;
      promptHash: string;
    },
  ) {
    return tx.socialPostVersion.create({
      data: {
        socialPostId,
        versionNumber,
        headline: params.payload.headline,
        bodyText: params.payload.post,
        hashtags: params.payload.hashtags,
        cta: params.payload.callToAction,
        model: params.model,
        promptHash: params.promptHash,
      },
    });
  }

  private markLatestVersion(tx: Prisma.TransactionClient, socialPostId: string, versionNumber: number) {
    return tx.socialPost.update({
      where: { id: socialPostId },
      data: {
        latestVersionNumber: versionNumber,
        status: SocialPostStatus.DRAFT,
        error: null,
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });
  }

  private async persistUsageLog(
    tx: Prisma.TransactionClient,
    params: {
      topicId: string;
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    },
    contentItemId?: string,
  ) {
    if (!params.usage) {
      return;
    }

    await tx.llmUsageLog.create({
      data: {
        topicId: params.topicId,
        contentItemId,
        module: 'social.linkedin',
        model: params.model,
        promptTokens: params.usage.prompt_tokens,
        completionTokens: params.usage.completion_tokens,
        totalTokens: params.usage.total_tokens,
        costUsd: estimateLlmCostUsd({
          model: params.model,
          promptTokens: params.usage.prompt_tokens,
          completionTokens: params.usage.completion_tokens,
        }),
      },
    });
  }
}
