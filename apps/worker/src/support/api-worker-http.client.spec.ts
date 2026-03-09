import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiWorkerHttpClient } from './api-worker-http.client';

describe('ApiWorkerHttpClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('injects queue contract metadata for object payloads', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const client = new ApiWorkerHttpClient();
    await client.post('v1/internal/worker/research/run', { topicId: 'topic-1' });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(typeof requestInit.body).toBe('string');
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      topicId: 'topic-1',
      contractVersion: 1,
    });
  });
});
