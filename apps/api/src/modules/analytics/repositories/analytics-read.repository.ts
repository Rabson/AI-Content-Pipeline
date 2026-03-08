import { Injectable } from '@nestjs/common';
import { PrismaService } from '@api/prisma/prisma.service';
import { buildOverviewBuckets } from './analytics-overview-bucket.helper';
import { toOverviewRows } from './analytics-overview-row.helper';
import { loadOverviewSourceData } from './analytics-overview-source.helper';
import { getUsageRollups } from './analytics-usage-read.helper';
import { startOfUtcDay } from '../utils/analytics-date.util';

@Injectable()
export class AnalyticsReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  getUsageRollups(days: number) {
    return getUsageRollups(this.prisma, rangeStart(days));
  }

  async getOverview(days: number) {
    const start = rangeStart(days);
    const rows = await this.prisma.analyticsDailyOverview.findMany({
      where: { usageDate: { gte: start } },
      orderBy: { usageDate: 'asc' },
    });
    if (rows.length > 0) return rows;
    return toOverviewRows(buildOverviewBuckets(await loadOverviewSourceData(this.prisma, start)));
  }
}

function rangeStart(days: number) {
  return startOfUtcDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
}
