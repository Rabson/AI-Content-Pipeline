import { Injectable, NotFoundException } from '@nestjs/common';
import { TopicRepository } from '../../topic/topic.repository';
import { TopicScoringService } from '../../topic/topic.scoring.service';
import { DEFAULT_DISCOVERY_MIN_SCORE } from '../constants/discovery.constants';
import { DiscoveryRepository } from '../discovery.repository';
import { CreateDiscoveryTopicDto } from '../dto/create-discovery-topic.dto';
import { DiscoveryCandidate } from '../providers/discovery-provider.interface';
import { assertDiscoveryEnabled } from '../utils/discovery.util';
import { prepareCandidateIngest } from './discovery-ingest-create.helper';
import { rejectDiscoveryCandidate, scoreDiscoveryCandidate } from './discovery-ingest-score.helper';
import type { DiscoveryIngestDependencies, DiscoveryIngestOptions } from './discovery-ingest.types';
import { WorkflowService } from '../../workflow/workflow.service';

@Injectable()
export class DiscoveryIngestService {
  private readonly deps: DiscoveryIngestDependencies;

  constructor(
    discoveryRepository: DiscoveryRepository,
    topicRepository: TopicRepository,
    scoringService: TopicScoringService,
    workflowService: WorkflowService,
  ) {
    this.deps = { discoveryRepository, topicRepository, scoringService, workflowService };
  }

  createManualCandidate(dto: CreateDiscoveryTopicDto, actorId: string) {
    assertDiscoveryEnabled();
    return this.ingestCandidate({
      title: dto.title,
      brief: dto.brief,
      audience: dto.audience,
      tags: dto.tags ?? [],
      source: 'DISCOVERY_MANUAL',
      sourceUrl: dto.sourceUrl,
      metadata: { provider: 'manual' },
    }, { actorId, autoScore: dto.autoScore ?? true, minimumScore: dto.minimumScore ?? DEFAULT_DISCOVERY_MIN_SCORE });
  }

  async ingestCandidate(candidate: DiscoveryCandidate, options: DiscoveryIngestOptions) {
    const intake = await prepareCandidateIngest(this.deps, candidate, options.actorId);
    if (intake.duplicate) return intake.duplicate;
    if (!options.autoScore) return { topic: intake.submitted, disposition: 'submitted' as const, scoreTotal: null };

    const score = await scoreDiscoveryCandidate(this.deps, intake.submitted.id, candidate, intake.title, intake.tags, options);
    if (score.total < options.minimumScore) {
      const rejected = await rejectDiscoveryCandidate(this.deps, intake.submitted.id, options.actorId, options.minimumScore, score.total);
      return { topic: rejected, disposition: 'filtered_out' as const, scoreTotal: score.total };
    }

    const scored = await this.deps.topicRepository.findById(intake.submitted.id);
    if (!scored) throw new NotFoundException('Scored discovery candidate not found');
    return { topic: scored, disposition: 'scored' as const, scoreTotal: score.total };
  }
}
