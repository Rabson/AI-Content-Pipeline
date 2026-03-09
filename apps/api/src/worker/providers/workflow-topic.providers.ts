import { TopicRepository } from '@api/modules/topic/topic.repository';
import { TopicScoringService } from '@api/modules/topic/topic.scoring.service';
import { WorkflowRepository } from '@api/modules/workflow/workflow.repository';
import { WorkflowService } from '@api/modules/workflow/workflow.service';
import { WorkflowTransitionService } from '@api/modules/workflow/workflow-transition.service';

export const workflowTopicWorkerProviders = [
  WorkflowRepository,
  WorkflowTransitionService,
  WorkflowService,
  TopicRepository,
  TopicScoringService,
] as const;
