import { Injectable } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import type { SeoJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class SeoJobRunnerService implements SeoJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  run(topicId: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.seoRun.path, { topicId });
  }
}
