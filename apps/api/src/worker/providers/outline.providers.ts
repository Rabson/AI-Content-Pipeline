import { OutlineOrchestrator } from '@api/modules/outline/outline.orchestrator';
import { OpenAiOutlineClient } from '@api/modules/outline/providers/openai-outline.client';
import { OutlineValidatorService } from '@api/modules/outline/providers/outline-validator.service';
import { OutlineRepository } from '@api/modules/outline/outline.repository';

export const outlineWorkerProviders = [
  OutlineRepository,
  OutlineOrchestrator,
  OpenAiOutlineClient,
  OutlineValidatorService,
] as const;

export const outlineWorkerBindings = {
  OutlineOrchestrator,
  OutlineRepository,
} as const;
