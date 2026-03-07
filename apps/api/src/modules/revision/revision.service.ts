import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CONTENT_PIPELINE_QUEUE } from './constants/revision.constants';
import { GetDiffQueryDto } from './dto/get-diff-query.dto';
import { RunRevisionDto } from './dto/run-revision.dto';
import { enqueueRevisionRun } from './revision-enqueue.helper';
import { compareDraftVersions, getRevisionDiffOrThrow, getRevisionRunOrThrow } from './revision-query.helper';
import { RevisionRepository } from './revision.repository';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class RevisionService {
  constructor(
    private readonly repository: RevisionRepository,
    private readonly workflowService: WorkflowService,
    @InjectQueue(CONTENT_PIPELINE_QUEUE) private readonly contentPipelineQueue: Queue,
  ) {}

  enqueueRevision(reviewSessionId: string, dto: RunRevisionDto, actorId: string) {
    return enqueueRevisionRun(this.repository, this.workflowService, this.contentPipelineQueue, reviewSessionId, dto, actorId);
  }

  getRevisionRun(revisionRunId: string) {
    return getRevisionRunOrThrow(this.repository, revisionRunId);
  }

  getRevisionDiff(revisionRunId: string) {
    return getRevisionDiffOrThrow(this.repository, revisionRunId);
  }

  listRevisionRuns(topicId: string) {
    return this.repository.listRevisionRuns(topicId);
  }

  compareDraftVersions(topicId: string, query: GetDiffQueryDto) {
    return compareDraftVersions(this.repository, topicId, query);
  }
}
