import 'server-only';

import { getDashboardAuthHeaders } from './auth';
import { parseErrorInfo } from './error-display';
import { env } from '../config/env';

export async function backendMutation<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getDashboardAuthHeaders();
  const response = await fetch(`${env.apiBase}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    const errorInfo = parseErrorInfo(body);
    throw new BackendRequestError({
      message: errorInfo.message,
      code: errorInfo.code,
      status: response.status,
      details: errorInfo.details,
      rawBody: body,
    });
  }

  return (await response.json()) as T;
}

interface BackendRequestErrorOptions {
  message: string;
  code?: string | null;
  status: number;
  details?: unknown;
  rawBody: string;
}

export class BackendRequestError extends Error {
  readonly code?: string | null;
  readonly status: number;
  readonly details?: unknown;
  readonly rawBody: string;

  constructor(options: BackendRequestErrorOptions) {
    super(options.message);
    this.name = 'BackendRequestError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.rawBody = options.rawBody;
  }
}
