import { Body, Controller, Post } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { ResearchOrchestrator } from './research.orchestrator';

type RunResearchBody = {
  topicId: string;
  traceId?: string;
};

@Controller(WORKER_INTERNAL_ROUTES.researchRun.controller)
export class ResearchWorkerController {
  constructor(private readonly researchOrchestrator: ResearchOrchestrator) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.researchRun.action)
  run(@Body() body: RunResearchBody) {
    assertWorkerContractVersion(body);
    return this.researchOrchestrator.run(body.topicId, body.traceId);
  }
}
