import type { PrismaService } from '../../../prisma/prisma.service';
import { startOfUtcDay } from '../utils/analytics-date.util';
import type { UsageBucket } from './analytics-overview.types';

export async function getUsageRollups(prisma: PrismaService, start: Date) {
  const rows = await prisma.analyticsDailyUsage.findMany({
    where: { usageDate: { gte: start } },
    orderBy: [{ usageDate: 'asc' }, { module: 'asc' }, { model: 'asc' }],
  });
  if (rows.length > 0) return rows;

  const logs = await prisma.llmUsageLog.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true, module: true, model: true, totalTokens: true, costUsd: true },
    orderBy: [{ createdAt: 'asc' }, { module: 'asc' }, { model: 'asc' }],
  });

  const grouped = new Map<string, UsageBucket>();
  for (const log of logs) {
    const usageDate = startOfUtcDay(log.createdAt);
    const key = `${usageDate.toISOString()}|${log.module}|${log.model}`;
    const current = grouped.get(key) ?? createUsageBucket(usageDate, log.module, log.model);
    current.totalTokens += log.totalTokens;
    current.estimatedCostUsd += Number(log.costUsd ?? 0);
    grouped.set(key, current);
  }

  return [...grouped.values()].sort((left, right) =>
    `${left.usageDate.toISOString()}${left.module}${left.model}`.localeCompare(
      `${right.usageDate.toISOString()}${right.module}${right.model}`,
    ),
  );
}

function createUsageBucket(usageDate: Date, module: string, model: string): UsageBucket {
  return { usageDate, module, model, totalTokens: 0, estimatedCostUsd: 0 };
}
