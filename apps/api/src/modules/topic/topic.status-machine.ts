import { Injectable } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class TopicStatusMachine {
  constructor(private readonly workflowService: WorkflowService) {}

  assertTransition(from: TopicStatus, to: TopicStatus): void {
    this.workflowService.assertTopicTransition(from, to);
  }
}
