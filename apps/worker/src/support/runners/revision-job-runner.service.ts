import { Injectable } from '@nestjs/common';
import {
  WORKER_INTERNAL_ROUTES,
  type RevisionApplySectionJobPayload,
} from '@aicp/queue-contracts';
import type { RevisionJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class RevisionJobRunnerService implements RevisionJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  processRevisionSection(payload: RevisionApplySectionJobPayload) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.revisionProcessSection.path, payload);
  }

  finalizeRevision(revisionRunId: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.revisionFinalize.path, { revisionRunId });
  }
}
