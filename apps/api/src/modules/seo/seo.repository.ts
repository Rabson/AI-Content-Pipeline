import { Injectable } from '@nestjs/common';
import { ArtifactType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { estimateLlmCostUsd } from '../../common/llm/usage-cost.util';

@Injectable()
export class SeoRepository {
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

  latestSeo(topicId: string) {
    return this.prisma.seoMetadata.findFirst({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async nextVersion(topicId: string) {
    const latest = await this.prisma.artifactVersion.findFirst({
      where: { topicId, artifactType: ArtifactType.SEO },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    return (latest?.versionNumber ?? 0) + 1;
  }

  async persistGeneratedSeo(params: {
    topicId: string;
    payload: {
      title: string;
      metaDescription: string;
      canonicalSlug: string;
      keywords: string[];
      openGraphTitle: string;
      openGraphDescription: string;
    };
    model: string;
    promptHash: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }) {
    const versionNumber = await this.nextVersion(params.topicId);
    const topic = await this.findTopicById(params.topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const artifact = await this.createArtifactVersion(tx, params, versionNumber);
      const seo = await this.createSeoMetadata(tx, params, topic.contentItemId ?? undefined, artifact.id);
      await this.persistUsageLog(tx, params, topic.contentItemId ?? undefined);
      return seo;
    });
  }

  private createArtifactVersion(
    tx: Prisma.TransactionClient,
    params: {
      topicId: string;
      payload: Record<string, unknown>;
      model: string;
      promptHash: string;
    },
    versionNumber: number,
  ) {
    return tx.artifactVersion.create({
      data: {
        topicId: params.topicId,
        artifactType: ArtifactType.SEO,
        versionNumber,
        payloadJson: params.payload as unknown as Prisma.InputJsonValue,
        model: params.model,
        promptHash: params.promptHash,
      },
    });
  }

  private createSeoMetadata(
    tx: Prisma.TransactionClient,
    params: {
      topicId: string;
      payload: {
        title: string;
        metaDescription: string;
        canonicalSlug: string;
        keywords: string[];
        openGraphTitle: string;
        openGraphDescription: string;
      };
      model: string;
      promptHash: string;
    },
    contentItemId: string | undefined,
    artifactVersionId: string,
  ) {
    return tx.seoMetadata.create({
      data: {
        topicId: params.topicId,
        contentItemId,
        artifactVersionId,
        slug: params.payload.canonicalSlug,
        metaTitle: params.payload.title,
        metaDescription: params.payload.metaDescription,
        canonicalUrl: null,
        tags: params.payload.keywords,
        keywords: params.payload.keywords,
        openGraphTitle: params.payload.openGraphTitle,
        openGraphDescription: params.payload.openGraphDescription,
        model: params.model,
        promptHash: params.promptHash,
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
    contentItemId: string | undefined,
  ) {
    if (!params.usage) {
      return;
    }

    await tx.llmUsageLog.create({
      data: {
        topicId: params.topicId,
        contentItemId,
        module: 'seo',
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
