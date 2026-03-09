import { Body, Controller, Post } from '@nestjs/common';
import {
  WORKER_INTERNAL_ROUTES,
  type RevisionApplySectionJobPayload,
} from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { RevisionOrchestrator } from './revision.orchestrator';
import { RevisionRepository } from './revision.repository';

type FinalizeRevisionBody = {
  revisionRunId: string;
};

type MarkRevisionFailedBody = {
  revisionRunId: string;
  reason: string;
};

@Controller(WORKER_INTERNAL_ROUTES.revisionProcessSection.controller)
export class RevisionWorkerController {
  constructor(
    private readonly revisionOrchestrator: RevisionOrchestrator,
    private readonly revisionRepository: RevisionRepository,
  ) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.revisionProcessSection.action)
  processSection(@Body() payload: RevisionApplySectionJobPayload) {
    assertWorkerContractVersion(payload);
    return this.revisionOrchestrator.processRevisionSection(payload);
  }

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.revisionFinalize.action)
  finalize(@Body() body: FinalizeRevisionBody) {
    assertWorkerContractVersion(body);
    return this.revisionOrchestrator.finalizeRevision(body.revisionRunId);
  }

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.revisionMarkFailed.action)
  markFailed(@Body() body: MarkRevisionFailedBody) {
    assertWorkerContractVersion(body);
    return this.revisionRepository.markRevisionRunFailed(body.revisionRunId, body.reason);
  }
}
