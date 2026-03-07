import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { estimateLlmCostUsd } from '../../../common/llm/usage-cost.util';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RevisionUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  createUsageLog(data: Prisma.LlmUsageLogCreateInput) {
    const payload = data as unknown as Prisma.LlmUsageLogUncheckedCreateInput & {
      topic?: { connect?: { id?: string } };
    };
    const topicId = payload.topicId ?? payload.topic?.connect?.id;

    return this.prisma.$transaction(async (tx) => {
      const topic = topicId
        ? await tx.topic.findUnique({
            where: { id: topicId },
            select: { contentItemId: true },
          })
        : null;

      return tx.llmUsageLog.create({
        data: {
          ...data,
          contentItem: topic?.contentItemId ? { connect: { id: topic.contentItemId } } : undefined,
          costUsd:
            payload.costUsd ??
            estimateLlmCostUsd({
              model: String(payload.model),
              promptTokens: Number(payload.promptTokens),
              completionTokens: Number(payload.completionTokens),
            }),
        },
      });
    });
  }
}
