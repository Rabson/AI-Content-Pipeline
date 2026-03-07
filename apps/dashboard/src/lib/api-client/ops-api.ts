import { safeFetch } from './core';

export interface OpsHealthPayload {
  status?: string;
  service?: string;
  appEnv?: string;
  nodeEnv?: string;
  uptimeSeconds?: number;
  telemetry?: Record<string, unknown>;
  timestamp?: string;
}

export interface OpsReadinessPayload {
  ready?: boolean;
  service?: string;
  appEnv?: string;
  telemetry?: Record<string, unknown>;
  dependencies?: Record<string, unknown>;
  timestamp?: string;
}

export interface WorkerRuntimeView {
  configured: boolean;
  baseUrl: string | null;
  health:
    | {
        ok: boolean;
        statusCode: number;
        payload: Record<string, unknown> | null;
        error?: string;
      }
    | null;
  readiness:
    | {
        ok: boolean;
        statusCode: number;
        payload: Record<string, unknown> | null;
        error?: string;
      }
    | null;
  error: string | null;
}

export interface OpsRuntimeStatusView {
  api: {
    health: OpsHealthPayload;
    readiness: OpsReadinessPayload;
  };
  worker: WorkerRuntimeView;
  timestamp: string;
}

export interface QueueMetricsView {
  queues: Record<string, Record<string, number>>;
  executionsLast24Hours: Record<string, Record<string, number>>;
  timestamp: string;
}

export interface FailedJobView {
  id: string;
  queueName: string;
  jobName: string;
  status: string;
  errorMessage?: string | null;
  startedAt: string;
  finishedAt?: string | null;
}

export function getOpsRuntimeStatus() {
  return safeFetch<OpsRuntimeStatusView | null>('/v1/ops/runtime-status', undefined, null);
}

export function getQueueMetrics() {
  return safeFetch<QueueMetricsView | null>('/v1/ops/queue-metrics', undefined, null);
}

export function getFailedJobs() {
  return safeFetch<FailedJobView[]>('/v1/ops/failed-jobs?limit=10', undefined, []);
}
