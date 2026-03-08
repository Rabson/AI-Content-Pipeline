import type { AnalyticsOverviewView, AnalyticsUsageView, ContentMetricsView } from '@aicp/contracts';
import { safeFetch } from './core';

export function getAnalyticsUsage() {
  return safeFetch<AnalyticsUsageView[]>('/v1/analytics/llm-usage?days=14', undefined, []);
}

export function getAnalyticsOverview() {
  return safeFetch<AnalyticsOverviewView[]>('/v1/analytics/overview?days=14', undefined, []);
}

export function getContentMetrics(contentItemId: string) {
  return safeFetch<ContentMetricsView | null>(`/v1/analytics/topics/${contentItemId}`, undefined, null);
}
