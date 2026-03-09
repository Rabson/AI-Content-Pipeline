import { Injectable } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import type { DiscoveryJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class DiscoveryJobRunnerService implements DiscoveryJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  runImport(payload: unknown) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.discoveryImport.path, payload);
  }
}
