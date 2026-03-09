import { DraftOrchestrator } from '@api/modules/draft/draft.orchestrator';
import { OpenAiDraftClient } from '@api/modules/draft/providers/openai-draft.client';
import { DraftValidatorService } from '@api/modules/draft/providers/draft-validator.service';
import { DraftReadRepository } from '@api/modules/draft/repositories/draft-read.repository';
import { DraftWriteRepository } from '@api/modules/draft/repositories/draft-write.repository';
import { DraftRepository } from '@api/modules/draft/draft.repository';

export const draftWorkerProviders = [
  DraftRepository,
  DraftReadRepository,
  DraftWriteRepository,
  DraftOrchestrator,
  OpenAiDraftClient,
  DraftValidatorService,
] as const;

export const draftWorkerBindings = {
  DraftOrchestrator,
  DraftRepository,
} as const;
