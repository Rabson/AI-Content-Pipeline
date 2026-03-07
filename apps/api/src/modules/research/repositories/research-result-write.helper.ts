import { ArtifactType, Prisma, TopicStatus } from '@prisma/client';
import { estimateLlmCostUsd } from '../../../common/llm/usage-cost.util';
import type { PrismaService } from '../../../prisma/prisma.service';
import type { PersistResearchResultParams } from './research-write.types';

export function markTopicStatus(prisma: PrismaService, topicId: string, status: TopicStatus) {
  return prisma.topic.update({ where: { id: topicId }, data: { status } });
}

export async function persistResearchResult(prisma: PrismaService, params: PersistResearchResultParams) {
  return prisma.$transaction(async (tx) => {
    const artifactVersion = await tx.artifactVersion.create({
      data: {
        topicId: params.topicId,
        artifactType: ArtifactType.RESEARCH,
        versionNumber: params.versionNumber,
        payloadJson: params.payload as Prisma.InputJsonValue,
        model: params.model,
        promptHash: params.promptHash,
      },
    });

    const artifact = await tx.researchArtifact.create({
      data: {
        topicId: params.topicId,
        artifactVersionId: artifactVersion.id,
        summary: params.output.summary,
        confidenceScore: params.output.confidenceScore,
        keyPointsCount: params.output.keyPoints.length,
        examplesCount: params.output.examples.length,
      },
    });

    await tx.sourceReference.createMany({
      data: params.output.sources.map((source) => ({
        researchArtifactId: artifact.id,
        url: source.url,
        title: source.title,
        credibilityScore: source.credibilityScore,
      })),
    });
    await tx.researchKeyPoint.createMany({
      data: params.output.keyPoints.map((keyPoint) => ({
        researchArtifactId: artifact.id,
        point: keyPoint.point,
        importance: keyPoint.importance,
        sourceRefIds: keyPoint.sourceIds,
      })),
    });
    await tx.researchExample.createMany({
      data: params.output.examples.map((example) => ({
        researchArtifactId: artifact.id,
        exampleTitle: example.title,
        exampleBody: example.description,
        takeaway: example.takeaway,
        sourceRefIds: example.sourceIds,
      })),
    });
    await tx.topic.update({ where: { id: params.topicId }, data: { status: TopicStatus.RESEARCH_READY } });
    await persistResearchUsageLog(tx, params);
    return artifact;
  });
}

async function persistResearchUsageLog(tx: Prisma.TransactionClient, params: PersistResearchResultParams) {
  if (!params.usage) return;
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
