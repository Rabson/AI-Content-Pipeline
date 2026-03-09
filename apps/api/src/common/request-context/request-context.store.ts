import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
  traceId: string;
};

const requestContextStore = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, callback: () => T): T {
  return requestContextStore.run(context, callback);
}

export function getRequestContext(): RequestContext | null {
  return requestContextStore.getStore() ?? null;
}
