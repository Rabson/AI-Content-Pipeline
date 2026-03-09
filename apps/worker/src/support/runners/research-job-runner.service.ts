import { Injectable } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import type { ResearchJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class ResearchJobRunnerService implements ResearchJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  run(topicId: string, traceId?: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.researchRun.path, { topicId, traceId });
  }
}
