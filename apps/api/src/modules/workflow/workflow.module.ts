import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@api/prisma/prisma.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowRepository } from './workflow.repository';
import { WorkflowService } from './workflow.service';
import { WorkflowTransitionService } from './workflow-transition.service';

@Global()
@Module({
  controllers: [WorkflowController],
  providers: [PrismaService, WorkflowRepository, WorkflowTransitionService, WorkflowService],
  exports: [WorkflowRepository, WorkflowTransitionService, WorkflowService],
})
export class WorkflowModule {}
