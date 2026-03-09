import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { signServiceToken } from '@aicp/auth-core';
import { withQueueContractEnvelope } from '@aicp/queue-contracts';
import { env } from '@worker/config/env';

@Injectable()
export class ApiWorkerHttpClient {
  async post<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(this.url(path), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.withContractEnvelope(payload)),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(await this.message(response));
    }

    return (await response.json()) as T;
  }

  private url(path: string) {
    const baseUrl = env.internalApiBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');
    return `${baseUrl}/${normalizedPath}`;
  }

  private token() {
    return signServiceToken({
      secret: env.internalServiceJwtSecret,
      issuer: env.internalServiceJwtIssuer,
      audience: env.internalServiceJwtAudience,
      subject: 'worker-runtime',
      email: 'worker-runtime@internal.local',
      role: 'ADMIN',
      ttlSeconds: env.internalServiceJwtTtlSeconds,
    });
  }

  private withContractEnvelope(payload: unknown) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return payload;
    }

    return withQueueContractEnvelope(payload as Record<string, unknown>);
  }

  private async message(response: Response) {
    const body = await response.text();
    return `Internal API ${response.status} ${response.statusText}: ${body || 'empty response'}`;
  }
}
