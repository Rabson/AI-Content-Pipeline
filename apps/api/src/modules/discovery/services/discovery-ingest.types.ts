import type { TopicRepository } from '../../topic/topic.repository';
import type { TopicScoringService } from '../../topic/topic.scoring.service';
import type { WorkflowService } from '../../workflow/workflow.service';
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
