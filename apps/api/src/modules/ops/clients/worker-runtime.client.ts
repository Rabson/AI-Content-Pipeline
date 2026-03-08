import { Injectable } from '@nestjs/common';
import { fetchWithTimeout } from '@api/common/http/external-fetch.util';
import { env } from '@api/config/env';

@Injectable()
export class WorkerRuntimeClient {
  async runtimeStatus() {
    const baseUrl = env.workerHealthBaseUrl?.replace(/\/$/, '') ?? '';
    if (!baseUrl) {
      return {
        configured: false,
        baseUrl: null,
        health: null,
        readiness: null,
        error: 'WORKER_HEALTH_BASE_URL not configured',
      };
    }

    const [health, readiness] = await Promise.all([this.fetchJson(`${baseUrl}/health`), this.fetchJson(`${baseUrl}/ready`)]);

    return {
      configured: true,
      baseUrl,
      health,
      readiness,
      error: null,
    };
  }

  private async fetchJson(url: string) {
    try {
      const response = await fetchWithTimeout(
        url,
        { cache: 'no-store' },
        env.externalRequestTimeoutMs,
        'Worker runtime probe',
      );
      const payload = (await response.json()) as Record<string, unknown>;
      return { ok: response.ok, statusCode: response.status, payload };
    } catch (error) {
      return {
        ok: false,
        statusCode: 0,
        payload: null,
        error: error instanceof Error ? error.message : 'Fetch failed',
      };
    }
  }
}
