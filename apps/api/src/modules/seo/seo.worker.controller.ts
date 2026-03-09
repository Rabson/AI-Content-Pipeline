import { Body, Controller, Post } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { SeoOrchestrator } from './seo.orchestrator';

type RunSeoBody = {
  topicId: string;
};

@Controller(WORKER_INTERNAL_ROUTES.seoRun.controller)
export class SeoWorkerController {
  constructor(private readonly seoOrchestrator: SeoOrchestrator) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.seoRun.action)
  run(@Body() body: RunSeoBody) {
    assertWorkerContractVersion(body);
    return this.seoOrchestrator.run(body.topicId);
  }
}
