import { Body, Controller, Post } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { AnalyticsOrchestrator } from './analytics.orchestrator';

type RunRollupBody = {
  usageDate?: string;
};

@Controller(WORKER_INTERNAL_ROUTES.analyticsRollup.controller)
export class AnalyticsWorkerController {
  constructor(private readonly analyticsOrchestrator: AnalyticsOrchestrator) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.analyticsRollup.action)
  runDailyRollup(@Body() body: RunRollupBody) {
    assertWorkerContractVersion(body);
    return this.analyticsOrchestrator.runDailyRollup(body.usageDate);
  }
}
