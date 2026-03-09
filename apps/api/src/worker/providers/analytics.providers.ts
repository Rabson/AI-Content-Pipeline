import { AnalyticsOrchestrator } from '@api/modules/analytics/analytics.orchestrator';
import { AnalyticsRepository } from '@api/modules/analytics/analytics.repository';
import { AnalyticsContentRepository } from '@api/modules/analytics/repositories/analytics-content.repository';
import { AnalyticsReadRepository } from '@api/modules/analytics/repositories/analytics-read.repository';
import { AnalyticsRollupRepository } from '@api/modules/analytics/repositories/analytics-rollup.repository';

export const analyticsWorkerProviders = [
  AnalyticsRepository,
  AnalyticsContentRepository,
  AnalyticsReadRepository,
  AnalyticsRollupRepository,
  AnalyticsOrchestrator,
] as const;

export const analyticsWorkerBindings = {
  AnalyticsOrchestrator,
} as const;
