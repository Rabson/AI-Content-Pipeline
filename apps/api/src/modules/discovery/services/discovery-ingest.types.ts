import type { TopicRepository } from '@api/modules/topic/topic.repository';
import type { TopicScoringService } from '@api/modules/topic/topic.scoring.service';
import type { WorkflowService } from '@api/modules/workflow/workflow.service';
import type { DiscoveryRepository } from '../discovery.repository';

export interface DiscoveryIngestOptions {
  autoScore: boolean;
  minimumScore: number;
  query?: string;
  actorId: string;
}

export interface DiscoveryIngestDependencies {
  discoveryRepository: DiscoveryRepository;
  topicRepository: TopicRepository;
  scoringService: TopicScoringService;
  workflowService: WorkflowService;
}
