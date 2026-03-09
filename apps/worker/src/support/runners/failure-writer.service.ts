import { Injectable } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import type {
  DraftFailureWriter,
  OutlineFailureWriter,
  RevisionFailureWriter,
} from '@worker/contracts/failure-writers.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class FailureWriterService
  implements DraftFailureWriter, OutlineFailureWriter, RevisionFailureWriter
{
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  markDraftFailed(draftVersionId: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.draftMarkFailed.path, { draftVersionId });
  }

  markFailed(topicId: string, reason: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.outlineMarkFailed.path, { topicId, reason });
  }

  markRevisionRunFailed(revisionRunId: string, reason: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.revisionMarkFailed.path, { revisionRunId, reason });
  }
}
