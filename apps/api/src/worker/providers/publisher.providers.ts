import { PublisherOrchestrator } from '@api/modules/publisher/publisher.orchestrator';
import { DevtoAdapter } from '@api/modules/publisher/providers/devto.adapter';
import { LinkedInAdapter } from '@api/modules/publisher/providers/linkedin.adapter';
import { MediumAdapter } from '@api/modules/publisher/providers/medium.adapter';
import { PublicationVerifierService } from '@api/modules/publisher/providers/publication-verifier.service';
import { PublisherRegistryService } from '@api/modules/publisher/providers/publisher-registry.service';
import { PublisherRepository } from '@api/modules/publisher/publisher.repository';
import { UserPublisherCredentialRepository } from '@api/modules/user/repositories/user-publisher-credential.repository';
import { TokenCryptoService } from '@api/modules/user/services/token-crypto.service';
import { UserPublisherTokenResolverService } from '@api/modules/user/services/user-publisher-token-resolver.service';

export const publisherWorkerProviders = [
  PublisherRepository,
  UserPublisherCredentialRepository,
  TokenCryptoService,
  UserPublisherTokenResolverService,
  PublisherOrchestrator,
  DevtoAdapter,
  MediumAdapter,
  LinkedInAdapter,
  PublisherRegistryService,
  PublicationVerifierService,
] as const;

export const publisherWorkerBindings = {
  PublisherOrchestrator,
} as const;
