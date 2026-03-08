import { Injectable } from '@nestjs/common';
import { PrismaService } from '@api/prisma/prisma.service';
import { hoursBetween } from '../utils/analytics-date.util';

@Injectable()
export class AnalyticsRollupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async rollupDailyUsage(usageDate: Date) {
    const start = new Date(usageDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const grouped = await this.prisma.llmUsageLog.groupBy({
      by: ['module', 'model'],
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        totalTokens: true,
        costUsd: true,
      },
    });

    await this.prisma.$transaction(
      grouped.map((item) =>
        this.prisma.analyticsDailyUsage.upsert({
          where: {
            usageDate_module_model: {
              usageDate: start,
              module: item.module,
              model: item.model,
            },
          },
          update: {
            totalTokens: item._sum.totalTokens ?? 0,
            estimatedCostUsd: item._sum.costUsd ?? 0,
          },
          create: {
            usageDate: start,
            module: item.module,
            model: item.model,
            totalTokens: item._sum.totalTokens ?? 0,
            estimatedCostUsd: item._sum.costUsd ?? 0,
          },
        }),
      ),
    );

    return grouped.length;
  }

  async rollupDailyOverview(usageDate: Date) {
    const { start, end } = this.dayRange(usageDate);
    const metrics = await this.loadOverviewMetrics(start, end);
    return this.prisma.analyticsDailyOverview.upsert({
      where: { usageDate: start },
      update: {
        ...metrics,
      },
      create: {
        usageDate: start,
        ...metrics,
      },
    });
  }

  private dayRange(usageDate: Date) {
    const start = new Date(usageDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private async loadOverviewMetrics(start: Date, end: Date) {
    const [publications, revisions, approvedDrafts, approvedTopics] = await Promise.all([
      this.prisma.publication.findMany({
        where: {
          publishedAt: { gte: start, lt: end },
          contentItemId: { not: null },
        },
        include: { contentItem: true },
      }),
      this.prisma.revisionRun.findMany({
        where: { completedAt: { gte: start, lt: end } },
      }),
      this.prisma.draftVersion.findMany({
        where: { approvedAt: { gte: start, lt: end } },
      }),
      this.prisma.topic.findMany({
        where: { approvedAt: { gte: start, lt: end } },
      }),
    ]);

    const leadTimeSamples = publications
      .filter((publication) => publication.publishedAt && publication.contentItem)
      .map((publication) => hoursBetween(publication.contentItem!.createdAt, publication.publishedAt!));
    const approvalLatencySamples = approvedTopics
      .filter((topic) => topic.approvedAt)
      .map((topic) => hoursBetween(topic.createdAt, topic.approvedAt!));

    return {
      throughputCount: publications.length,
      revisionCount: revisions.length,
      publishCount: publications.length,
      publishCadenceCount: publications.length,
      avgLeadTimeHours: this.average(leadTimeSamples),
      avgRevisionRate: approvedDrafts.length > 0 ? revisions.length / approvedDrafts.length : 0,
      avgApprovalLatencyHours: this.average(approvalLatencySamples),
    };
  }

  private average(values: number[]) {
    if (!values.length) {
      return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
