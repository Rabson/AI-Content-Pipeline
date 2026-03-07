import { createTelemetryRuntime } from '../../../api/src/common/observability/runtime/telemetry-runtime';

const runtime = createTelemetryRuntime('worker');

export const startOpenTelemetry = runtime.startOpenTelemetry;
export const shutdownOpenTelemetry = runtime.shutdownOpenTelemetry;
export const getTelemetryStatus = runtime.getTelemetryStatus;
export const getTraceContext = runtime.getTraceContext;
export const withTelemetrySpan = runtime.withTelemetrySpan;
