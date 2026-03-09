import { ResearchOrchestrator } from '@api/modules/research/research.orchestrator';
import { ResearchRepository } from '@api/modules/research/research.repository';
import { OpenAiResearchClient } from '@api/modules/research/providers/openai-research.client';
import { ResearchValidatorService } from '@api/modules/research/providers/research-validator.service';
import { SourceGathererService } from '@api/modules/research/providers/source-gatherer.service';
import { SourceNormalizerService } from '@api/modules/research/providers/source-normalizer.service';
import { ResearchReadRepository } from '@api/modules/research/repositories/research-read.repository';
import { ResearchWriteRepository } from '@api/modules/research/repositories/research-write.repository';

export const researchWorkerProviders = [
  ResearchRepository,
  ResearchReadRepository,
  ResearchWriteRepository,
  ResearchOrchestrator,
  SourceGathererService,
  SourceNormalizerService,
  OpenAiResearchClient,
  ResearchValidatorService,
] as const;

export const researchWorkerBindings = {
  ResearchOrchestrator,
} as const;
