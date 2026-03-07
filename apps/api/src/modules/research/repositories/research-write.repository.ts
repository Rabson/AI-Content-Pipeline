import { Injectable } from '@nestjs/common';
import { ArtifactType, Prisma, SourceType, TopicStatus } from '@prisma/client';
import { estimateLlmCostUsd } from '../../../common/llm/usage-cost.util';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ResearchWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  markTopicStatus(topicId: string, status: TopicStatus) {
    return this.prisma.topic.update({
      where: { id: topicId },
      data: { status },
    });
  }

  async addManualSource(
    topicId: string,
    latestResearchId: string,
    data: {
      url: string;
      domain?: string | null;
      title?: string;
      excerpt?: string;
      sourceType: SourceType;
    },
  ) {
    return this.prisma.sourceReference.create({
      data: {
        researchArtifactId: latestResearchId,
        url: data.url,
        domain: data.domain,
        title: data.title,
        excerpt: data.excerpt,
        sourceType: data.sourceType,
      },
    });
  }

  async persistResearchResult(params: {
    topicId: string;
    contentItemId?: string;
    versionNumber: number;
    model: string;
    promptHash: string;
    payload: Record<string, unknown>;
    output: {
      summary: string;
      confidenceScore: number;
      sources: Array<{
        id: string;
        url: string;
        title: string;
        credibilityScore: number;
      }>;
      keyPoints: Array<{
        point: string;
        importance: string;
        sourceIds: string[];
      }>;
      examples: Array<{
        title: string;
        description: string;
        takeaway: string;
        sourceIds: string[];
      }>;
    };
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }) {
    return this.prisma.$transaction(async (tx) => {
      const artifactVersion = await this.createArtifactVersion(tx, params);
      const artifact = await this.createResearchArtifact(tx, params, artifactVersion.id);
      await this.persistSources(tx, artifact.id, params.output.sources);
      await this.persistKeyPoints(tx, artifact.id, params.output.keyPoints);
      await this.persistExamples(tx, artifact.id, params.output.examples);
      await this.markResearchReady(tx, params.topicId);
      await this.persistUsageLog(tx, params);
      return artifact;
    });
  }

  async persistFailedExecution(topicId: string, payload: Record<string, unknown>, error: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.topic.update({ where: { id: topicId }, data: { status: TopicStatus.FAILED } });
      await tx.topicStatusHistory.create({
        data: {
          topicId,
          fromStatus: TopicStatus.RESEARCH_IN_PROGRESS,
          toStatus: TopicStatus.FAILED,
          actorId: 'worker',
          reason: error,
          metadata: payload as Prisma.InputJsonValue,
        },
      });
    });
  }

  private createArtifactVersion(
    tx: Prisma.TransactionClient,
    params: {
      topicId: string;
      versionNumber: number;
      model: string;
      promptHash: string;
      payload: Record<string, unknown>;
    },
  ) {
    return tx.artifactVersion.create({
      data: {
        topicId: params.topicId,
        artifactType: ArtifactType.RESEARCH,
        versionNumber: params.versionNumber,
        payloadJson: params.payload as Prisma.InputJsonValue,
        model: params.model,
        promptHash: params.promptHash,
      },
    });
  }

  private createResearchArtifact(
    tx: Prisma.TransactionClient,
    params: {
      topicId: string;
      output: {
        summary: string;
        confidenceScore: number;
        keyPoints: Array<unknown>;
        examples: Array<unknown>;
      };
    },
    artifactVersionId: string,
  ) {
    return tx.researchArtifact.create({
      data: {
        topicId: params.topicId,
        artifactVersionId,
        summary: params.output.summary,
        confidenceScore: params.output.confidenceScore,
        keyPointsCount: params.output.keyPoints.length,
        examplesCount: params.output.examples.length,
      },
    });
  }

  private persistSources(
    tx: Prisma.TransactionClient,
    researchArtifactId: string,
    sources: Array<{ url: string; title: string; credibilityScore: number }>,
  ) {
    return tx.sourceReference.createMany({
      data: sources.map((source) => ({
        researchArtifactId,
        url: source.url,
        title: source.title,
        credibilityScore: source.credibilityScore,
      })),
    });
  }

  private persistKeyPoints(
    tx: Prisma.TransactionClient,
    researchArtifactId: string,
    keyPoints: Array<{ point: string; importance: string; sourceIds: string[] }>,
  ) {
    return tx.researchKeyPoint.createMany({
      data: keyPoints.map((keyPoint) => ({
        researchArtifactId,
        point: keyPoint.point,
        importance: keyPoint.importance,
        sourceRefIds: keyPoint.sourceIds,
      })),
    });
  }

  private persistExamples(
    tx: Prisma.TransactionClient,
    researchArtifactId: string,
    examples: Array<{ title: string; description: string; takeaway: string; sourceIds: string[] }>,
  ) {
    return tx.researchExample.createMany({
      data: examples.map((example) => ({
        researchArtifactId,
        exampleTitle: example.title,
        exampleBody: example.description,
        takeaway: example.takeaway,
        sourceRefIds: example.sourceIds,
      })),
    });
  }

  private markResearchReady(tx: Prisma.TransactionClient, topicId: string) {
    return tx.topic.update({
      where: { id: topicId },
      data: { status: TopicStatus.RESEARCH_READY },
    });
  }

  private async persistUsageLog(
    tx: Prisma.TransactionClient,
    params: {
      topicId: string;
      contentItemId?: string;
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    },
  ) {
    if (!params.usage) {
      return;
    }

    await tx.llmUsageLog.create({
      data: {
        topicId: params.topicId,
        contentItemId: params.contentItemId,
        module: 'research',
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
