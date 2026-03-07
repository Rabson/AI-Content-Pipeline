import 'server-only';

import type { TopicSummary } from '@aicp/shared-types';
import { getDashboardAuthHeaders } from '../auth';

export const API_BASE =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3001/api';

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeTopic<T extends Partial<TopicSummary>>(topic: T): T {
  return {
    ...topic,
    scoreTotal: toNullableNumber(topic.scoreTotal),
    tags: Array.isArray(topic.tags)
      ? topic.tags
          .filter((tag): tag is { tag: string } => Boolean(tag?.tag))
          .map((tag) => ({ tag: tag.tag }))
      : [],
  };
}

export async function safeFetch<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  const hasFallback = arguments.length >= 3;

  try {
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
      if (hasFallback) {
        return fallback as T;
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    if (hasFallback) {
      return fallback as T;
    }
    throw new Error(`API request failed for ${path}`);
  }
}
