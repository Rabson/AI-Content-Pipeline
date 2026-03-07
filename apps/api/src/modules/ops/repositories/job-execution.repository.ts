import { Injectable } from '@nestjs/common';
import { JobExecutionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JobExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  listFailedExecutions(limit: number) {
    return this.prisma.jobExecution.findMany({
      where: { status: JobExecutionStatus.FAILED },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
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
