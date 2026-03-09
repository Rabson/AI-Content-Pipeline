import { describe, expect, it } from 'vitest';
import { DiagLogLevel } from '@opentelemetry/api';
import { buildStatus, parseDiagLogLevel, parseHeaders } from './telemetry-config';

describe('telemetry-config', () => {
  it('parses diagnostic log levels with safe fallback', () => {
    expect(parseDiagLogLevel('debug')).toBe(DiagLogLevel.DEBUG);
    expect(parseDiagLogLevel('WARN')).toBe(DiagLogLevel.WARN);
    expect(parseDiagLogLevel('unknown')).toBe(DiagLogLevel.ERROR);
  });

  it('parses OTEL header csv values', () => {
    expect(parseHeaders('authorization=Bearer abc,x-tenant=team-a')).toEqual({
      authorization: 'Bearer abc',
      'x-tenant': 'team-a',
    });
    expect(parseHeaders(undefined)).toEqual({});
  });

  it('builds status with exporter metadata', () => {
    const status = buildStatus(
      {
        appEnv: 'dev',
        otelEnabled: true,
        otelExporterEndpoint: null,
        otelTracesEndpoint: 'http://otel:4318/v1/traces',
        otelHeaders: null,
        otelServiceNamespace: 'aicp',
        otelLogLevel: 'INFO',
      },
      'api-service',
    );

    expect(status).toMatchObject({
      enabled: true,
      serviceName: 'api-service',
      serviceNamespace: 'aicp',
      exporter: 'otlp-http',
      endpoint: 'http://otel:4318/v1/traces',
      logLevel: 'info',
      started: false,
      lastError: null,
    });
  });
});
