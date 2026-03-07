import { Injectable, NotFoundException } from '@nestjs/common';
import { ArtifactType, Prisma, TopicStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { estimateLlmCostUsd } from '../../common/llm/usage-cost.util';

@Injectable()
export class OutlineRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicById(topicId: string) {
    return this.prisma.topic.findFirst({ where: { id: topicId, deletedAt: null } });
  }

  latestOutline(topicId: string) {
    return this.prisma.outline.findFirst({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      include: { sections: { orderBy: { position: 'asc' } }, artifactVersion: true },
    });
  }

  outlineByVersion(topicId: string, versionNumber: number) {
    return this.prisma.outline.findFirst({
      where: {
        topicId,
        artifactVersion: {
          artifactType: ArtifactType.OUTLINE,
          versionNumber,
        },
      },
      include: { sections: { orderBy: { position: 'asc' } }, artifactVersion: true },
    });
  }

  async getNextVersion(topicId: string): Promise<number> {
    const latest = await this.prisma.artifactVersion.findFirst({
      where: { topicId, artifactType: ArtifactType.OUTLINE },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    return (latest?.versionNumber ?? 0) + 1;
  }

  async getLatestResearch(topicId: string) {
    return this.prisma.researchArtifact.findFirst({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      include: { keyPoints: true },
    });
  }

  async persistGeneratedOutline(params: {
    topicId: string;
    model: string;
    promptHash: string;
    payload: Record<string, unknown>;
    outline: {
      title: string;
      objective: string;
      sections: Array<{ sectionKey: string; heading: string; objective: string; targetWords: number }>;
    };
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }) {
    const nextVersion = await this.getNextVersion(params.topicId);
    const topic = await this.findTopicById(params.topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const artifactVersion = await this.createArtifactVersion(tx, params, nextVersion);
      const outline = await this.createOutline(tx, params, artifactVersion.id);
      await this.markTopicStatus(tx, params.topicId);
      await this.persistUsageLog(tx, params, topic.contentItemId ?? undefined);
      return outline;
    });
  }

  async markFailed(topicId: string, error: string) {
    if (!(await this.findTopicById(topicId))) {
      throw new NotFoundException('Topic not found');
    }

    return this.prisma.topicStatusHistory.create({
      data: {
        topicId,
        fromStatus: TopicStatus.RESEARCH_READY,
        toStatus: TopicStatus.RESEARCH_READY,
        actorId: 'worker',
        reason: error,
        metadata: { stage: 'outline.generate' } as Prisma.InputJsonValue,
      },
    });
  }

  private createArtifactVersion(
    tx: Prisma.TransactionClient,
    params: { topicId: string; payload: Record<string, unknown>; model: string; promptHash: string },
    versionNumber: number,
  ) {
    return tx.artifactVersion.create({
      data: {
        topicId: params.topicId,
        artifactType: ArtifactType.OUTLINE,
        versionNumber,
        payloadJson: params.payload as Prisma.InputJsonValue,
        model: params.model,
        promptHash: params.promptHash,
      },
    });
  }

  private createOutline(
    tx: Prisma.TransactionClient,
    params: {
      topicId: string;
      outline: {
        title: string;
        objective: string;
        sections: Array<{ sectionKey: string; heading: string; objective: string; targetWords: number }>;
      };
    },
    artifactVersionId: string,
  ) {
    return tx.outline.create({
      data: {
        topicId: params.topicId,
        artifactVersionId,
        title: params.outline.title,
        objective: params.outline.objective,
        sections: {
          create: params.outline.sections.map((section, index) => ({
            sectionKey: section.sectionKey,
            heading: section.heading,
            objective: section.objective,
            position: index + 1,
            targetWords: section.targetWords || 250,
          })),
        },
      },
      include: { sections: { orderBy: { position: 'asc' } }, artifactVersion: true },
    });
  }

  private markTopicStatus(tx: Prisma.TransactionClient, topicId: string) {
    return tx.topic.update({
      where: { id: topicId },
      data: { status: TopicStatus.RESEARCH_READY },
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
        module: 'outline',
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
