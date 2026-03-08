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
  health: { ok: boolean; statusCode: number; payload: Record<string, unknown> | null; error?: string } | null;
  readiness: { ok: boolean; statusCode: number; payload: Record<string, unknown> | null; error?: string } | null;
  error: string | null;
}

export interface OpsRuntimeStatusView {
  api: { health: OpsHealthPayload; readiness: OpsReadinessPayload };
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

export interface SecurityEventView {
  id: string;
  eventType: string;
  actorUser?: { id: string; email: string; role: string; name?: string | null } | null;
  subjectUser?: { id: string; email: string; role: string; name?: string | null } | null;
  subjectEmail?: string | null;
  ipAddress?: string | null;
  path?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface FailedPublicationView {
  id: string;
  topicId: string;
  channel: string;
  status: string;
  title: string;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  topic: {
    id: string;
    title: string;
    slug: string;
    owner?: { id: string; email: string; role: string; name?: string | null } | null;
  };
  publisherUser?: { id: string; email: string; role: string; name?: string | null } | null;
  requestedByUser?: { id: string; email: string; role: string; name?: string | null } | null;
  attempts?: Array<{ id: string; status: string; error?: string | null; createdAt: string }>;
}
