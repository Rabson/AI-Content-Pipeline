import { describe, expect, it, vi } from 'vitest';
import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { assertAllowedHost, fetchWithTimeout, throwUpstreamHttpError } from './external-fetch.util';

describe('external fetch utilities', () => {
  it('rejects disallowed hosts', () => {
    expect(() => assertAllowedHost('https://example.com/data', ['hn.algolia.com'], 'Discovery')).toThrow(
      BadGatewayException,
    );
  });

  it('maps aborted requests to gateway timeout', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn((_url, init) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      }),
    ) as any;

    await expect(fetchWithTimeout('https://hn.algolia.com', {}, 1, 'Discovery')).rejects.toThrow(
      GatewayTimeoutException,
    );
    global.fetch = originalFetch;
  });

  it('maps retryable upstream statuses to service unavailable', async () => {
    await expect(
      throwUpstreamHttpError(new Response('rate limit', { status: 429 }), 'OpenAI'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('maps non-retryable upstream statuses to bad gateway', async () => {
    await expect(
      throwUpstreamHttpError(new Response('bad input', { status: 400 }), 'Discovery'),
    ).rejects.toThrow(BadGatewayException);
  });
});
