import { createTelemetryRuntime } from './runtime/telemetry-runtime';

const runtime = createTelemetryRuntime('api');

export const startOpenTelemetry = runtime.startOpenTelemetry;
export const shutdownOpenTelemetry = runtime.shutdownOpenTelemetry;
export const getTelemetryStatus = runtime.getTelemetryStatus;
export const getTraceContext = runtime.getTraceContext;
export const withTelemetrySpan = runtime.withTelemetrySpan;
