import { Body, Controller, Post } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { OutlineOrchestrator } from './outline.orchestrator';
import { OutlineRepository } from './outline.repository';

type RunOutlineBody = {
  topicId: string;
};

type MarkOutlineFailedBody = {
  topicId: string;
  reason: string;
};

@Controller(WORKER_INTERNAL_ROUTES.outlineRun.controller)
export class OutlineWorkerController {
  constructor(
    private readonly outlineOrchestrator: OutlineOrchestrator,
    private readonly outlineRepository: OutlineRepository,
  ) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.outlineRun.action)
  run(@Body() body: RunOutlineBody) {
    assertWorkerContractVersion(body);
    return this.outlineOrchestrator.run(body.topicId);
  }

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.outlineMarkFailed.action)
  markFailed(@Body() body: MarkOutlineFailedBody) {
    assertWorkerContractVersion(body);
    return this.outlineRepository.markFailed(body.topicId, body.reason);
  }
}
