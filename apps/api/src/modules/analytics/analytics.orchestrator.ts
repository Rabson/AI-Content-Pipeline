import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsOrchestrator {
  constructor(private readonly repository: AnalyticsRepository) {}

  async runDailyRollup(usageDate?: string) {
    const targetDate = usageDate ? new Date(usageDate) : new Date();
    const usageRows = await this.repository.rollupDailyUsage(targetDate);
    const overview = await this.repository.rollupDailyOverview(targetDate);

    return {
      rolledUpUsageRows: usageRows,
      overview,
      usageDate: targetDate.toISOString(),
    };
  }
}
