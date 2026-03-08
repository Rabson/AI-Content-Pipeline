import { createTelemetryRuntime } from '@aicp/observability-core';
import { env } from '../config/env';

const runtime = createTelemetryRuntime('worker', env);

export const startOpenTelemetry = runtime.startOpenTelemetry;
export const shutdownOpenTelemetry = runtime.shutdownOpenTelemetry;
export const getTelemetryStatus = runtime.getTelemetryStatus;
export const getTraceContext = runtime.getTraceContext;
export const withTelemetrySpan = runtime.withTelemetrySpan;
