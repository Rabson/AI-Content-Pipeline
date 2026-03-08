import { safeFetch } from './core';
export type {
  FailedJobView,
  FailedPublicationView,
  OpsHealthPayload,
  OpsReadinessPayload,
  OpsRuntimeStatusView,
  QueueMetricsView,
  SecurityEventView,
  WorkerRuntimeView,
} from './ops-types';
import type {
  FailedJobView,
  FailedPublicationView,
  OpsRuntimeStatusView,
  QueueMetricsView,
  SecurityEventView,
} from './ops-types';

export function getOpsRuntimeStatus() {
  return safeFetch<OpsRuntimeStatusView | null>('/v1/ops/runtime-status', undefined, null);
}

export function getQueueMetrics() {
  return safeFetch<QueueMetricsView | null>('/v1/ops/queue-metrics', undefined, null);
}

export function getFailedJobs() {
  return safeFetch<FailedJobView[]>('/v1/ops/failed-jobs?limit=10', undefined, []);
}

export function getSecurityEvents() {
  return safeFetch<SecurityEventView[]>('/v1/ops/security-events?limit=20', undefined, []);
}

export function getFailedPublications() {
  return safeFetch<FailedPublicationView[]>('/v1/ops/publication-failures?limit=10', undefined, []);
}
