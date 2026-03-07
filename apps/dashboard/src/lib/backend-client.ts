import 'server-only';

import { getDashboardAuthHeaders } from './auth';

const API_BASE =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3001/api';

export async function backendMutation<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getDashboardAuthHeaders();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}
