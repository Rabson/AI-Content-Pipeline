import { BadRequestException, Injectable, Optional, ServiceUnavailableException } from '@nestjs/common';
import type { DiscoveryImportJobPayload } from '@aicp/queue-contracts';
import { DISCOVERY_PROVIDER_HACKER_NEWS } from '../constants/discovery.constants';
import { ImportDiscoveryTopicsDto } from '../dto/import-discovery-topics.dto';
import { DiscoveryProvider } from '../providers/discovery-provider.interface';
import { HackerNewsDiscoveryProvider } from '../providers/hacker-news-discovery.provider';
import { assertDiscoveryEnabled } from '../utils/discovery.util';
import { DiscoveryIngestService } from './discovery-ingest.service';
import { DiscoveryQueueService } from '../discovery.queue.service';

@Injectable()
export class DiscoveryImportService {
  constructor(
    private readonly hackerNewsProvider: HackerNewsDiscoveryProvider,
    private readonly discoveryIngestService: DiscoveryIngestService,
    @Optional() private readonly discoveryQueueService?: DiscoveryQueueService,
  ) {}

  async enqueueImport(dto: ImportDiscoveryTopicsDto, actorId: string) {
    assertDiscoveryEnabled();
    if (!this.discoveryQueueService) {
      throw new ServiceUnavailableException('Discovery queue is not configured in this runtime');
    }

    const jobId = await this.discoveryQueueService.enqueueImport({
      provider: dto.provider,
      query: dto.query,
      limit: dto.limit,
      audience: dto.audience,
      tags: dto.tags,
      autoScore: dto.autoScore,
      minimumScore: dto.minimumScore,
      actorId,
    });

    return {
      jobId,
      provider: dto.provider,
      query: dto.query ?? null,
      status: 'queued',
      queuedAt: new Date().toISOString(),
    };
  }

  async runImport(payload: DiscoveryImportJobPayload) {
    assertDiscoveryEnabled();

    const provider = this.resolveProvider(payload.provider);
    const candidates = await provider.fetchCandidates({
      query: payload.query,
      limit: payload.limit,
      audience: payload.audience,
      tags: payload.tags,
    });

    const results = [];
    for (const candidate of candidates) {
      const result = await this.discoveryIngestService.ingestCandidate(candidate, {
        actorId: payload.actorId,
        autoScore: payload.autoScore,
        minimumScore: payload.minimumScore,
        query: payload.query,
      });

      results.push({
        topicId: result.topic.id,
        title: result.topic.title,
        disposition: result.disposition,
        scoreTotal: result.scoreTotal,
        status: result.topic.status,
      });
    }

    return {
      provider: payload.provider,
      query: payload.query ?? null,
      fetched: candidates.length,
      imported: results.filter((item) => item.disposition !== 'duplicate').length,
      duplicates: results.filter((item) => item.disposition === 'duplicate').length,
      filteredOut: results.filter((item) => item.disposition === 'filtered_out').length,
      results,
      completedAt: new Date().toISOString(),
    };
  }

  private resolveProvider(provider: string): DiscoveryProvider {
    if (provider === DISCOVERY_PROVIDER_HACKER_NEWS) {
      return this.hackerNewsProvider;
    }

    throw new BadRequestException(`Unsupported discovery provider: ${provider}`);
  }
}
