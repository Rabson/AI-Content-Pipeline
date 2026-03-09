import { Injectable } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import type { AnalyticsJobRunner } from '@worker/contracts/job-runners.contracts';
import { ApiWorkerHttpClient } from '@worker/support/api-worker-http.client';

@Injectable()
export class AnalyticsJobRunnerService implements AnalyticsJobRunner {
  constructor(private readonly httpClient: ApiWorkerHttpClient) {}

  runDailyRollup(usageDate: string) {
    return this.httpClient.post(WORKER_INTERNAL_ROUTES.analyticsRollup.path, { usageDate });
  }
}
