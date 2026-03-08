import { createTelemetryRuntime } from '@aicp/observability-core';
import { env } from '@api/config/env';

const runtime = createTelemetryRuntime('api', env);

export const startOpenTelemetry = runtime.startOpenTelemetry;
export const shutdownOpenTelemetry = runtime.shutdownOpenTelemetry;
export const getTelemetryStatus = runtime.getTelemetryStatus;
export const getTraceContext = runtime.getTraceContext;
export const withTelemetrySpan = runtime.withTelemetrySpan;
