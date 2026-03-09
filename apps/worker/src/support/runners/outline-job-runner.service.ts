import { Injectable } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import type { OutlineJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class OutlineJobRunnerService implements OutlineJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  run(topicId: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.outlineRun.path, { topicId });
  }
}
