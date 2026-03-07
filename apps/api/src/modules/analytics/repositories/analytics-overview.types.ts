export interface UsageBucket {
  usageDate: Date;
  module: string;
  model: string;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface OverviewBucket {
  usageDate: Date;
  throughputCount: number;
  revisionCount: number;
  publishCount: number;
  publishCadenceCount: number;
  leadTimeSamples: number[];
  approvalLatencySamples: number[];
  approvedDrafts: number;
}
