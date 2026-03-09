import { Injectable } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES, type DraftGenerateSectionJobPayload } from '@aicp/queue-contracts';
import type { DraftJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class DraftJobRunnerService implements DraftJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  processSection(payload: DraftGenerateSectionJobPayload) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.draftProcessSection.path, payload);
  }

  finalizeDraft(draftVersionId: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.draftFinalize.path, { draftVersionId });
  }
}
