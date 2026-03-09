import { Injectable } from '@nestjs/common';
import { JobExecutionStatus } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

function readCorrelation(payloadJson: unknown) {
  if (!payloadJson || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
    return { traceId: null, requestId: null };
  }

  const payload = payloadJson as Record<string, unknown>;
  return {
    traceId: typeof payload.traceId === 'string' ? payload.traceId : null,
    requestId: typeof payload.requestId === 'string' ? payload.requestId : null,
  };
}

@Injectable()
export class JobExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listFailedExecutions(limit: number) {
    const jobs = await this.prisma.jobExecution.findMany({
      where: { status: JobExecutionStatus.FAILED },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return jobs.map((job) => ({ ...job, ...readCorrelation(job.payloadJson) }));
  }

  findExecutionById(id: string) {
    return this.prisma.jobExecution.findUnique({
      where: { id },
    });
  }

  countExecutionsSince(startedAt: Date) {
    return this.prisma.jobExecution.groupBy({
      by: ['status', 'queueName'],
      where: {
        startedAt: {
          gte: startedAt,
        },
      },
      _count: {
        _all: true,
      },
    });
  }
}
