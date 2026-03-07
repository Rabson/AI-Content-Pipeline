import { Injectable } from '@nestjs/common';
import { AnalyticsContentRepository } from './repositories/analytics-content.repository';
import { AnalyticsReadRepository } from './repositories/analytics-read.repository';
import { AnalyticsRollupRepository } from './repositories/analytics-rollup.repository';

@Injectable()
export class AnalyticsRepository {
  constructor(
    private readonly contentRepository: AnalyticsContentRepository,
    private readonly readRepository: AnalyticsReadRepository,
    private readonly rollupRepository: AnalyticsRollupRepository,
  ) {}

  rollupDailyUsage(usageDate: Date) {
    return this.rollupRepository.rollupDailyUsage(usageDate);
  }

  rollupDailyOverview(usageDate: Date) {
    return this.rollupRepository.rollupDailyOverview(usageDate);
  }

  getUsageRollups(days: number) {
    return this.readRepository.getUsageRollups(days);
  }

  getOverview(days: number) {
    return this.readRepository.getOverview(days);
  }

  getContentMetrics(contentItemId: string) {
    return this.contentRepository.getContentMetrics(contentItemId);
  }
}
