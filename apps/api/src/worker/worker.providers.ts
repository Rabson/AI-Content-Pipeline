import { analyticsWorkerBindings, analyticsWorkerProviders } from './providers/analytics.providers';
import { discoveryWorkerBindings, discoveryWorkerProviders } from './providers/discovery.providers';
import { draftWorkerBindings, draftWorkerProviders } from './providers/draft.providers';
import { outlineWorkerBindings, outlineWorkerProviders } from './providers/outline.providers';
import { publisherWorkerBindings, publisherWorkerProviders } from './providers/publisher.providers';
import { researchWorkerBindings, researchWorkerProviders } from './providers/research.providers';
import { revisionWorkerBindings, revisionWorkerProviders } from './providers/revision.providers';
import { seoSocialWorkerBindings, seoSocialWorkerProviders } from './providers/seo-social.providers';
import { workflowTopicWorkerProviders } from './providers/workflow-topic.providers';

export const apiWorkerProviders = [
  ...workflowTopicWorkerProviders,
  ...discoveryWorkerProviders,
  ...researchWorkerProviders,
  ...outlineWorkerProviders,
  ...draftWorkerProviders,
  ...revisionWorkerProviders,
  ...seoSocialWorkerProviders,
  ...analyticsWorkerProviders,
  ...publisherWorkerProviders,
] as const;

export const apiWorkerBindings = {
  ...discoveryWorkerBindings,
  ...researchWorkerBindings,
  ...outlineWorkerBindings,
  ...draftWorkerBindings,
  ...revisionWorkerBindings,
  ...seoSocialWorkerBindings,
  ...analyticsWorkerBindings,
  ...publisherWorkerBindings,
} as const;
