import { Controller, Get, Param } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkflowService } from './workflow.service';

@Roles(AppRole.EDITOR)
@Controller('v1/topics/:topicId/workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('events')
  events(@Param('topicId') topicId: string) {
    return this.workflowService.listTopicEvents(topicId);
  }

  @Get('runs')
  runs(@Param('topicId') topicId: string) {
    return this.workflowService.listTopicRuns(topicId);
  }
}
