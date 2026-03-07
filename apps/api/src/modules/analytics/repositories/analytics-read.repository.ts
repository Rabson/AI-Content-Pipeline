import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { hoursBetween, startOfUtcDay, usageDateKey } from '../utils/analytics-date.util';

interface UsageBucket {
  usageDate: Date;
  module: string;
  model: string;
  totalTokens: number;
  estimatedCostUsd: number;
}

interface OverviewBucket {
  usageDate: Date;
  throughputCount: number;
  revisionCount: number;
  publishCount: number;
  publishCadenceCount: number;
  leadTimeSamples: number[];
  approvalLatencySamples: number[];
  approvedDrafts: number;
}

@Injectable()
export class AnalyticsReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUsageRollups(days: number) {
    const start = this.rangeStart(days);
    const rows = await this.prisma.analyticsDailyUsage.findMany({
      where: { usageDate: { gte: start } },
      orderBy: [{ usageDate: 'asc' }, { module: 'asc' }, { model: 'asc' }],
    });

    if (rows.length > 0) {
      return rows;
    }

    const logs = await this.prisma.llmUsageLog.findMany({
      where: { createdAt: { gte: start } },
      select: {
        createdAt: true,
        module: true,
        model: true,
        totalTokens: true,
        costUsd: true,
      },
      orderBy: [{ createdAt: 'asc' }, { module: 'asc' }, { model: 'asc' }],
    });

    const grouped = new Map<string, UsageBucket>();
    for (const log of logs) {
      const usageDate = startOfUtcDay(log.createdAt);
      const key = `${usageDate.toISOString()}|${log.module}|${log.model}`;
      const current = grouped.get(key) ?? this.createUsageBucket(usageDate, log.module, log.model);
      current.totalTokens += log.totalTokens;
      current.estimatedCostUsd += Number(log.costUsd ?? 0);
      grouped.set(key, current);
    }

    return [...grouped.values()].sort((left, right) =>
      `${left.usageDate.toISOString()}${left.module}${left.model}`.localeCompare(
        `${right.usageDate.toISOString()}${right.module}${right.model}`,
      ),
    );
  }

  async getOverview(days: number) {
    const start = this.rangeStart(days);
    const rows = await this.prisma.analyticsDailyOverview.findMany({
      where: { usageDate: { gte: start } },
      orderBy: { usageDate: 'asc' },
    });

    if (rows.length > 0) {
      return rows;
    }

    const buckets = this.buildOverviewBuckets(await this.loadOverviewSourceData(start));
    this.ensureOverviewData(buckets);
    return this.toOverviewRows(buckets);
  }

  private rangeStart(days: number) {
    return startOfUtcDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  }

  private loadOverviewSourceData(start: Date) {
    return Promise.all([
      this.prisma.topic.findMany({
        where: { OR: [{ createdAt: { gte: start } }, { approvedAt: { gte: start } }] },
        select: { createdAt: true, approvedAt: true },
      }),
      this.prisma.revisionRun.findMany({
        where: { OR: [{ createdAt: { gte: start } }, { completedAt: { gte: start } }] },
        select: { createdAt: true, completedAt: true },
      }),
      this.prisma.publication.findMany({
        where: { OR: [{ createdAt: { gte: start } }, { publishedAt: { gte: start } }] },
        select: {
          createdAt: true,
          publishedAt: true,
          contentItem: { select: { createdAt: true } },
        },
      }),
      this.prisma.draftVersion.findMany({
        where: { approvedAt: { gte: start } },
        select: { approvedAt: true },
      }),
    ]);
  }

  private buildOverviewBuckets(
    [topics, revisions, publications, approvedDrafts]: Awaited<ReturnType<AnalyticsReadRepository['loadOverviewSourceData']>>,
  ) {
    const buckets = new Map<string, OverviewBucket>();
    this.applyTopicMetrics(buckets, topics);
    this.applyRevisionMetrics(buckets, revisions);
    this.applyPublicationMetrics(buckets, publications);
    this.applyApprovedDraftMetrics(buckets, approvedDrafts);
    return buckets;
  }

  private applyTopicMetrics(
    buckets: Map<string, OverviewBucket>,
    topics: Array<{ createdAt: Date; approvedAt: Date | null }>,
  ) {
    for (const topic of topics) {
      this.ensureOverviewBucket(buckets, topic.createdAt).throughputCount += 1;
      if (topic.approvedAt) {
        this.ensureOverviewBucket(buckets, topic.approvedAt).approvalLatencySamples.push(
          hoursBetween(topic.createdAt, topic.approvedAt),
        );
      }
    }
  }

  private applyRevisionMetrics(
    buckets: Map<string, OverviewBucket>,
    revisions: Array<{ createdAt: Date; completedAt: Date | null }>,
  ) {
    for (const revision of revisions) {
      this.ensureOverviewBucket(buckets, revision.completedAt ?? revision.createdAt).revisionCount += 1;
    }
  }

  private applyPublicationMetrics(
    buckets: Map<string, OverviewBucket>,
    publications: Array<{ createdAt: Date; publishedAt: Date | null; contentItem: { createdAt: Date } | null }>,
  ) {
    for (const publication of publications) {
      const bucket = this.ensureOverviewBucket(buckets, publication.publishedAt ?? publication.createdAt);
      if (publication.publishedAt) {
        bucket.publishCount += 1;
        bucket.publishCadenceCount += 1;
      }
      if (publication.publishedAt && publication.contentItem) {
        bucket.leadTimeSamples.push(hoursBetween(publication.contentItem.createdAt, publication.publishedAt));
      }
    }
  }

  private applyApprovedDraftMetrics(
    buckets: Map<string, OverviewBucket>,
    drafts: Array<{ approvedAt: Date | null }>,
  ) {
    for (const draft of drafts) {
      if (draft.approvedAt) {
        this.ensureOverviewBucket(buckets, draft.approvedAt).approvedDrafts += 1;
      }
    }
  }

  private ensureOverviewData(buckets: Map<string, OverviewBucket>) {
    if (buckets.size > 0) {
      return;
    }

    const today = startOfUtcDay(new Date());
    buckets.set(today.toISOString(), this.createOverviewBucket(today));
  }

  private toOverviewRows(buckets: Map<string, OverviewBucket>) {
    return [...buckets.values()]
      .sort((left, right) => left.usageDate.getTime() - right.usageDate.getTime())
      .map((bucket) => ({
        usageDate: bucket.usageDate,
        throughputCount: bucket.throughputCount,
        revisionCount: bucket.revisionCount,
        publishCount: bucket.publishCount,
        publishCadenceCount: bucket.publishCadenceCount,
        avgLeadTimeHours: this.average(bucket.leadTimeSamples),
        avgRevisionRate: bucket.approvedDrafts > 0 ? bucket.revisionCount / bucket.approvedDrafts : 0,
        avgApprovalLatencyHours: this.average(bucket.approvalLatencySamples),
      }));
  }

  private createUsageBucket(usageDate: Date, module: string, model: string): UsageBucket {
    return { usageDate, module, model, totalTokens: 0, estimatedCostUsd: 0 };
  }

  private createOverviewBucket(usageDate: Date): OverviewBucket {
    return {
      usageDate,
      throughputCount: 0,
      revisionCount: 0,
      publishCount: 0,
      publishCadenceCount: 0,
      leadTimeSamples: [],
      approvalLatencySamples: [],
      approvedDrafts: 0,
    };
  }

  private ensureOverviewBucket(buckets: Map<string, OverviewBucket>, value: Date) {
    const key = usageDateKey(value);
    const existing = buckets.get(key) ?? this.createOverviewBucket(startOfUtcDay(value));
    buckets.set(key, existing);
    return existing;
  }

  private average(values: number[]) {
    if (!values.length) {
      return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
