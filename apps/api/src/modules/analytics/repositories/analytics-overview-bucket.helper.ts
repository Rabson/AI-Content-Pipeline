import { hoursBetween, startOfUtcDay, usageDateKey } from '../utils/analytics-date.util';
import type { OverviewBucket } from './analytics-overview.types';

export function buildOverviewBuckets(
  [topics, revisions, publications, approvedDrafts]: [
    Array<{ createdAt: Date; approvedAt: Date | null }>,
    Array<{ createdAt: Date; completedAt: Date | null }>,
    Array<{ createdAt: Date; publishedAt: Date | null; contentItem: { createdAt: Date } | null }>,
    Array<{ approvedAt: Date | null }>,
  ],
) {
  const buckets = new Map<string, OverviewBucket>();
  for (const topic of topics) {
    ensureOverviewBucket(buckets, topic.createdAt).throughputCount += 1;
    if (topic.approvedAt) ensureOverviewBucket(buckets, topic.approvedAt).approvalLatencySamples.push(hoursBetween(topic.createdAt, topic.approvedAt));
  }
  for (const revision of revisions) {
    ensureOverviewBucket(buckets, revision.completedAt ?? revision.createdAt).revisionCount += 1;
  }
  for (const publication of publications) {
    const bucket = ensureOverviewBucket(buckets, publication.publishedAt ?? publication.createdAt);
    if (publication.publishedAt) bucket.publishCount += 1;
    if (publication.publishedAt) bucket.publishCadenceCount += 1;
    if (publication.publishedAt && publication.contentItem) bucket.leadTimeSamples.push(hoursBetween(publication.contentItem.createdAt, publication.publishedAt));
  }
  for (const draft of approvedDrafts) {
    if (draft.approvedAt) ensureOverviewBucket(buckets, draft.approvedAt).approvedDrafts += 1;
  }
  if (buckets.size === 0) buckets.set(startOfUtcDay(new Date()).toISOString(), createOverviewBucket(startOfUtcDay(new Date())));
  return buckets;
}

function createOverviewBucket(usageDate: Date): OverviewBucket {
  return { usageDate, throughputCount: 0, revisionCount: 0, publishCount: 0, publishCadenceCount: 0, leadTimeSamples: [], approvalLatencySamples: [], approvedDrafts: 0 };
}

function ensureOverviewBucket(buckets: Map<string, OverviewBucket>, value: Date) {
  const key = usageDateKey(value);
  const existing = buckets.get(key) ?? createOverviewBucket(startOfUtcDay(value));
  buckets.set(key, existing);
  return existing;
}
