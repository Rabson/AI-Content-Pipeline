import { getAnalyticsOverview, getAnalyticsUsage, getTopics } from '../../lib/api-client';
import type { TopicSummary } from '@aicp/shared-types';

export async function loadAnalyticsData() {
  const [usage, overview, topics] = await Promise.all([getAnalyticsUsage(), getAnalyticsOverview(), getTopics()]);
  return { usage, overview, topics };
}

export function calculateAverageScore(topics: TopicSummary[]) {
  const scoredTopics = topics.filter((topic) => topic.scoreTotal !== null && topic.scoreTotal !== undefined);
  if (!scoredTopics.length) {
    return 0;
  }

  const total = scoredTopics.reduce((sum, topic) => sum + (topic.scoreTotal ?? 0), 0);
  return total / scoredTopics.length;
}
