import { Prisma, SocialPlatform, SocialPostStatus } from '@prisma/client';
import { estimateLlmCostUsd } from '../../common/llm/usage-cost.util';
import type { PrismaService } from '../../prisma/prisma.service';
import { findTopicById, getSocialPostOrThrow } from './social-read.helper';
import type { PersistGeneratedLinkedInDraftParams } from './social.repository.types';

export async function persistGeneratedLinkedInDraft(prisma: PrismaService, params: PersistGeneratedLinkedInDraftParams) {
  const topic = await findTopicById(prisma, params.topicId);
  if (!topic) throw new Error('Topic not found');

  return prisma.$transaction(async (tx) => {
    const socialPost = await ensureLinkedInPost(tx, params.topicId, topic.contentItemId ?? undefined);
    const versionNumber = socialPost.latestVersionNumber + 1;
    const version = await createLinkedInVersion(tx, socialPost.id, versionNumber, params);
    const updatedPost = await markLatestVersion(tx, socialPost.id, versionNumber);
    await persistUsageLog(tx, params, topic.contentItemId ?? undefined);
    return { ...updatedPost, versions: [version] };
  });
}

export async function applyStatus(prisma: PrismaService, id: string, status: SocialPostStatus, externalUrl?: string, error?: string | null) {
  const post = await getSocialPostOrThrow(prisma, id);
  const latestVersionNumber = post.latestVersionNumber || post.versions[0]?.versionNumber || 0;
  return prisma.socialPost.update({
    where: { id },
    data: {
      status,
      externalUrl: externalUrl ?? post.externalUrl,
      postedAt: status === SocialPostStatus.POSTED ? new Date() : post.postedAt,
      approvedVersionNumber: status === SocialPostStatus.APPROVED ? latestVersionNumber : post.approvedVersionNumber,
      postedVersionNumber: status === SocialPostStatus.POSTED ? latestVersionNumber : post.postedVersionNumber,
      error: error ?? null,
    },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
}

async function ensureLinkedInPost(tx: Prisma.TransactionClient, topicId: string, contentItemId?: string) {
  const existing = await tx.socialPost.findFirst({ where: { topicId, platform: SocialPlatform.LINKEDIN } });
  if (existing) return existing;
  return tx.socialPost.create({
    data: { topicId, contentItemId, platform: SocialPlatform.LINKEDIN, status: SocialPostStatus.DRAFT },
  });
}

function createLinkedInVersion(
  tx: Prisma.TransactionClient,
  socialPostId: string,
  versionNumber: number,
  params: PersistGeneratedLinkedInDraftParams,
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

function markLatestVersion(tx: Prisma.TransactionClient, socialPostId: string, versionNumber: number) {
  return tx.socialPost.update({
    where: { id: socialPostId },
    data: { latestVersionNumber: versionNumber, status: SocialPostStatus.DRAFT, error: null },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
}

async function persistUsageLog(tx: Prisma.TransactionClient, params: PersistGeneratedLinkedInDraftParams, contentItemId?: string) {
  if (!params.usage) return;
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
