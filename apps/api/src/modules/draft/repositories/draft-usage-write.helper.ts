import { Prisma } from '@prisma/client';
import { estimateLlmCostUsd } from '@api/common/llm/usage-cost.util';
import { PrismaService } from '@api/prisma/prisma.service';

export async function createUsageLog(prisma: PrismaService, data: Prisma.LlmUsageLogCreateInput) {
  const payload = data as unknown as Prisma.LlmUsageLogUncheckedCreateInput & { topic?: { connect?: { id?: string } } };
  const topicId = payload.topicId ?? payload.topic?.connect?.id;
  return prisma.$transaction(async (tx) => {
    const topic = topicId ? await tx.topic.findUnique({ where: { id: topicId }, select: { contentItemId: true } }) : null;
    return tx.llmUsageLog.create({
      data: {
        ...data,
        contentItem: topic?.contentItemId ? { connect: { id: topic.contentItemId } } : undefined,
        costUsd: payload.costUsd ?? estimateLlmCostUsd({ model: String(payload.model), promptTokens: Number(payload.promptTokens), completionTokens: Number(payload.completionTokens) }),
      },
    });
  });
}
