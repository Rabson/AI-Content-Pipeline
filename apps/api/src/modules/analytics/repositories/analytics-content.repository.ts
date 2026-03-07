import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { hoursBetween } from '../utils/analytics-date.util';

@Injectable()
export class AnalyticsContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getContentMetrics(contentItemId: string) {
    const item = await this.prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: {
        topic: true,
        llmUsageLogs: true,
        publications: true,
        workflowEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!item) {
      return null;
    }

    const published = item.publications.find((publication) => publication.publishedAt);
    const approvalEvent = item.workflowEvents.find((event) => event.eventType === 'TOPIC_APPROVED');

    return {
      contentItemId: item.id,
      topicId: item.topic?.id ?? null,
      topicTitle: item.topic?.title ?? null,
      currentState: item.currentState,
      revisionCount: item.workflowEvents.filter(
        (event) => event.stage === 'REVISION' && event.eventType === 'REVISION_REQUESTED',
      ).length,
      publicationCount: item.publications.length,
      publishedAt: published?.publishedAt ?? null,
      leadTimeHours: published?.publishedAt ? hoursBetween(item.createdAt, published.publishedAt) : null,
      approvalLatencyHours: approvalEvent ? hoursBetween(item.createdAt, approvalEvent.createdAt) : null,
      llmTokens: item.llmUsageLogs.reduce((sum, log) => sum + log.totalTokens, 0),
      llmCostUsd: item.llmUsageLogs.reduce((sum, log) => sum + Number(log.costUsd ?? 0), 0),
    };
  }
}
