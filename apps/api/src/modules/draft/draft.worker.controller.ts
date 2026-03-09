import { Body, Controller, Post } from '@nestjs/common';
import {
  WORKER_INTERNAL_ROUTES,
  type DraftGenerateSectionJobPayload,
} from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { DraftOrchestrator } from './draft.orchestrator';
import { DraftRepository } from './draft.repository';

type FinalizeDraftBody = {
  draftVersionId: string;
};

type MarkDraftFailedBody = {
  draftVersionId: string;
};

@Controller(WORKER_INTERNAL_ROUTES.draftProcessSection.controller)
export class DraftWorkerController {
  constructor(
    private readonly draftOrchestrator: DraftOrchestrator,
    private readonly draftRepository: DraftRepository,
  ) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.draftProcessSection.action)
  processSection(@Body() payload: DraftGenerateSectionJobPayload) {
    assertWorkerContractVersion(payload);
    return this.draftOrchestrator.processSection(payload);
  }

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.draftFinalize.action)
  finalize(@Body() body: FinalizeDraftBody) {
    assertWorkerContractVersion(body);
    return this.draftOrchestrator.finalizeDraft(body.draftVersionId);
  }

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.draftMarkFailed.action)
  markFailed(@Body() body: MarkDraftFailedBody) {
    assertWorkerContractVersion(body);
    return this.draftRepository.markDraftFailed(body.draftVersionId);
  }
}
