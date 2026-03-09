import { Body, Controller, Post } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { SocialOrchestrator } from './social.orchestrator';

type RunLinkedInBody = {
  topicId: string;
};

@Controller(WORKER_INTERNAL_ROUTES.socialLinkedInRun.controller)
export class SocialWorkerController {
  constructor(private readonly socialOrchestrator: SocialOrchestrator) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.socialLinkedInRun.action)
  runLinkedIn(@Body() body: RunLinkedInBody) {
    assertWorkerContractVersion(body);
    return this.socialOrchestrator.runLinkedIn(body.topicId);
  }
}
