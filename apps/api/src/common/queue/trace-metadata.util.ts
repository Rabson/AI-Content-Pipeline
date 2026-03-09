import { randomUUID } from 'node:crypto';
import { getRequestContext } from '../request-context/request-context.store';

type TraceMetadataInput = {
  traceId?: string;
  requestId?: string;
};

export function resolveQueueTraceMetadata(input?: TraceMetadataInput) {
  const context = getRequestContext();
  const requestId = input?.requestId ?? context?.requestId ?? randomUUID();
  const traceId = input?.traceId ?? context?.traceId ?? requestId;

  return { traceId, requestId };
}
