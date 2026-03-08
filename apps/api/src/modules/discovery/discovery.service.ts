import { Injectable } from '@nestjs/common';
import type { DiscoveryImportJobPayload } from '@aicp/shared-types';
import { CreateDiscoveryTopicDto } from './dto/create-discovery-topic.dto';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';
import { ImportDiscoveryTopicsDto } from './dto/import-discovery-topics.dto';
import { ListDiscoveryCandidatesQueryDto } from './dto/list-discovery-candidates-query.dto';
import { DiscoveryRepository } from './discovery.repository';
import { DiscoveryImportService } from './services/discovery-import.service';
import { DiscoveryIngestService } from './services/discovery-ingest.service';
import { DiscoverySuggestionService } from './services/discovery-suggestion.service';

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly discoveryRepository: DiscoveryRepository,
    private readonly discoverySuggestionService: DiscoverySuggestionService,
    private readonly discoveryIngestService: DiscoveryIngestService,
    private readonly discoveryImportService: DiscoveryImportService,
  ) {}

  async suggest(query: DiscoveryQueryDto) {
    return this.discoverySuggestionService.suggest(query);
  }

  async listCandidates(query: ListDiscoveryCandidatesQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await this.discoveryRepository.listCandidates({
      status: query.status,
      q: query.q,
      skip,
      take: query.limit,
    });

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async createManualCandidate(dto: CreateDiscoveryTopicDto, actorId: string) {
    return this.discoveryIngestService.createManualCandidate(dto, actorId);
  }

  async enqueueImport(dto: ImportDiscoveryTopicsDto, actorId: string) {
    return this.discoveryImportService.enqueueImport(dto, actorId);
  }

  async runImport(payload: DiscoveryImportJobPayload) {
    return this.discoveryImportService.runImport(payload);
  }
}
