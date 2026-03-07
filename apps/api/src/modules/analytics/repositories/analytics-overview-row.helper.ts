import type { OverviewBucket } from './analytics-overview.types';

export function toOverviewRows(buckets: Map<string, OverviewBucket>) {
  return [...buckets.values()]
    .sort((left, right) => left.usageDate.getTime() - right.usageDate.getTime())
    .map((bucket) => ({
      usageDate: bucket.usageDate,
      throughputCount: bucket.throughputCount,
      revisionCount: bucket.revisionCount,
      publishCount: bucket.publishCount,
      publishCadenceCount: bucket.publishCadenceCount,
      avgLeadTimeHours: average(bucket.leadTimeSamples),
      avgRevisionRate: bucket.approvedDrafts > 0 ? bucket.revisionCount / bucket.approvedDrafts : 0,
      avgApprovalLatencyHours: average(bucket.approvalLatencySamples),
    }));
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
