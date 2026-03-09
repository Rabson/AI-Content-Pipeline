import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { getTraceContext } from '../observability/opentelemetry';
import { runWithRequestContext } from './request-context.store';

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return undefined;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const requestId = firstHeaderValue(request.headers['x-request-id']) ?? randomUUID();
    const propagatedTraceId = firstHeaderValue(request.headers['x-trace-id']);
    const telemetryTraceId = getTraceContext().traceId ?? undefined;
    const traceId = propagatedTraceId ?? telemetryTraceId ?? requestId;

    response.setHeader('x-request-id', requestId);
    runWithRequestContext({ requestId, traceId }, next);
  }
}
