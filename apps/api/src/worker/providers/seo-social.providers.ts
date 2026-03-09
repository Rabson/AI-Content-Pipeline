import { SeoOrchestrator } from '@api/modules/seo/seo.orchestrator';
import { SeoGeneratorService } from '@api/modules/seo/providers/seo-generator.service';
import { SeoRepository } from '@api/modules/seo/seo.repository';
import { SocialOrchestrator } from '@api/modules/social/social.orchestrator';
import { SocialGeneratorService } from '@api/modules/social/providers/social-generator.service';
import { SocialRepository } from '@api/modules/social/social.repository';

export const seoSocialWorkerProviders = [
  SeoRepository,
  SeoOrchestrator,
  SeoGeneratorService,
  SocialRepository,
  SocialOrchestrator,
  SocialGeneratorService,
] as const;

export const seoSocialWorkerBindings = {
  SeoOrchestrator,
  SocialOrchestrator,
} as const;
