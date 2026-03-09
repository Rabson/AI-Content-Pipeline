import { DiscoveryRepository } from '@api/modules/discovery/discovery.repository';
import { HackerNewsDiscoveryProvider } from '@api/modules/discovery/providers/hacker-news-discovery.provider';
import { DiscoveryService } from '@api/modules/discovery/discovery.service';
import { DiscoveryImportService } from '@api/modules/discovery/services/discovery-import.service';
import { DiscoveryIngestService } from '@api/modules/discovery/services/discovery-ingest.service';
import { DiscoverySuggestionService } from '@api/modules/discovery/services/discovery-suggestion.service';

export const discoveryWorkerProviders = [
  HackerNewsDiscoveryProvider,
  DiscoveryRepository,
  DiscoverySuggestionService,
  DiscoveryIngestService,
  DiscoveryImportService,
  DiscoveryService,
] as const;

export const discoveryWorkerBindings = {
  DiscoveryService,
} as const;
