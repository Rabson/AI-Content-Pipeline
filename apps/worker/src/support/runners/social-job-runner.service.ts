import { Injectable } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import type { SocialJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class SocialJobRunnerService implements SocialJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  runLinkedIn(topicId: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.socialLinkedInRun.path, { topicId });
  }
}
