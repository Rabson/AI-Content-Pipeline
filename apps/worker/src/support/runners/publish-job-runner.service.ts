import { Injectable } from '@nestjs/common';
import {
  WORKER_INTERNAL_ROUTES,
  type PublishArticleJobPayload,
} from '@aicp/queue-contracts';
import type { PublishJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class PublishJobRunnerService implements PublishJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  publish(payload: PublishArticleJobPayload) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.publishArticle.path, payload);
  }
}
