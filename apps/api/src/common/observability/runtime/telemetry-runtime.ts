import { DiagConsoleLogger, SpanStatusCode, context, diag, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { env } from '../../../config/env';
import { buildStatus, parseDiagLogLevel, parseHeaders, type TelemetryStatus } from './telemetry-config';

export function createTelemetryRuntime(defaultServiceName: string) {
  let sdk: NodeSDK | null = null;
  let telemetryStatus: TelemetryStatus = buildStatus(defaultServiceName);

  async function startOpenTelemetry(serviceName: string) {
    if (sdk) return getTelemetryStatus();
    telemetryStatus = buildStatus(serviceName);
    if (!telemetryStatus.enabled) return getTelemetryStatus();
    if (!telemetryStatus.endpoint) {
      telemetryStatus.lastError = 'OTLP endpoint not configured';
      return getTelemetryStatus();
    }
    diag.setLogger(new DiagConsoleLogger(), parseDiagLogLevel(telemetryStatus.logLevel));
    sdk = new NodeSDK({
      resource: resourceFromAttributes({ 'service.name': serviceName, 'service.namespace': telemetryStatus.serviceNamespace, 'deployment.environment': env.appEnv }),
      traceExporter: new OTLPTraceExporter({ url: telemetryStatus.endpoint, headers: parseHeaders(env.otelHeaders) }),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    try {
      await sdk.start();
      telemetryStatus.started = true;
      telemetryStatus.lastError = null;
    } catch (error) {
      telemetryStatus.started = false;
      telemetryStatus.lastError = error instanceof Error ? error.message : 'Failed to start OpenTelemetry';
      sdk = null;
    }
    return getTelemetryStatus();
  }

  async function shutdownOpenTelemetry() {
    if (!sdk) return;
    await sdk.shutdown();
    sdk = null;
    telemetryStatus.started = false;
  }

  function getTelemetryStatus() { return { ...telemetryStatus }; }
  function getTraceContext() {
    const spanContext = trace.getSpan(context.active())?.spanContext();
    return { traceId: spanContext?.traceId ?? null, spanId: spanContext?.spanId ?? null, traceFlags: spanContext?.traceFlags ?? null };
  }

  async function withTelemetrySpan<T>(name: string, attributes: Record<string, string | number | boolean | undefined>, handler: () => Promise<T>) {
    const tracer = trace.getTracer(telemetryStatus.serviceName);
    return tracer.startActiveSpan(name, async (span) => {
      Object.entries(attributes).forEach(([key, value]) => value !== undefined && span.setAttribute(key, value));
      try {
        const result = await handler();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Telemetry span failed' });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  return { startOpenTelemetry, shutdownOpenTelemetry, getTelemetryStatus, getTraceContext, withTelemetrySpan };
}
