import { RevisionOrchestrator } from '@api/modules/revision/revision.orchestrator';
import { OpenAiRevisionClient } from '@api/modules/revision/providers/openai-revision.client';
import { DiffService } from '@api/modules/revision/providers/diff.service';
import { RevisionReadRepository } from '@api/modules/revision/repositories/revision-read.repository';
import { RevisionUsageRepository } from '@api/modules/revision/repositories/revision-usage.repository';
import { RevisionWriteRepository } from '@api/modules/revision/repositories/revision-write.repository';
import { RevisionRepository } from '@api/modules/revision/revision.repository';

export const revisionWorkerProviders = [
  RevisionRepository,
  RevisionReadRepository,
  RevisionUsageRepository,
  RevisionWriteRepository,
  RevisionOrchestrator,
  OpenAiRevisionClient,
  DiffService,
] as const;

export const revisionWorkerBindings = {
  RevisionOrchestrator,
  RevisionRepository,
} as const;
