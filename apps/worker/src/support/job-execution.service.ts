import { Injectable } from '@nestjs/common';
import { Prisma, JobExecutionStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../../api/src/prisma/prisma.service';

@Injectable()
export class JobExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  start(job: Job<any, any, string>) {
    const topicId = typeof job.data?.topicId === 'string' ? job.data.topicId : undefined;
    const contentItemId = typeof job.data?.contentItemId === 'string' ? job.data.contentItemId : undefined;

    return this.prisma.jobExecution.create({
      data: {
        queueName: job.queueName,
        jobName: job.name,
        bullJobId: job.id?.toString(),
        topicId,
        contentItemId,
        status: JobExecutionStatus.RUNNING,
        attempt: job.attemptsMade + 1,
        payloadJson: (job.data ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  succeed(executionId: string) {
    return this.prisma.jobExecution.update({
      where: { id: executionId },
      data: {
        status: JobExecutionStatus.SUCCEEDED,
        endedAt: new Date(),
      },
    });
  }

  fail(executionId: string, error: unknown, classification: string) {
    const message = error instanceof Error ? error.message : String(error);
    return this.prisma.jobExecution.update({
      where: { id: executionId },
      data: {
        status: JobExecutionStatus.FAILED,
        endedAt: new Date(),
        error: `[${classification}] ${message}`,
      },
    });
  }
}
