import { ArtifactType, Prisma, TopicStatus } from '@prisma/client';
import { estimateLlmCostUsd } from '../../common/llm/usage-cost.util';
import type { PrismaService } from '../../prisma/prisma.service';
import type { PersistGeneratedOutlineParams } from './outline-write.types';

export async function persistGeneratedOutline(
  prisma: PrismaService,
  params: PersistGeneratedOutlineParams,
  nextVersion: number,
  contentItemId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const artifactVersion = await tx.artifactVersion.create({
      data: {
        topicId: params.topicId,
        artifactType: ArtifactType.OUTLINE,
        versionNumber: nextVersion,
        payloadJson: params.payload as Prisma.InputJsonValue,
        model: params.model,
        promptHash: params.promptHash,
      },
    });

    const outline = await tx.outline.create({
      data: {
        topicId: params.topicId,
        artifactVersionId: artifactVersion.id,
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

    await tx.topic.update({ where: { id: params.topicId }, data: { status: TopicStatus.RESEARCH_READY } });
    await persistOutlineUsageLog(tx, params, contentItemId);
    return outline;
  });
}

async function persistOutlineUsageLog(
  tx: Prisma.TransactionClient,
  params: PersistGeneratedOutlineParams,
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
