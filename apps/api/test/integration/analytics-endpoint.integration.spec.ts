import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsController } from '@api/modules/analytics/analytics.controller';
import { AnalyticsService } from '@api/modules/analytics/analytics.service';

describe('AnalyticsController endpoint transport', () => {
  const enqueueDailyRollup = vi.fn().mockResolvedValue({ enqueued: true });

  afterEach(() => {
    enqueueDailyRollup.mockClear();
  });

  it('maps rollup route and delegates to service', async () => {
    const controller = new AnalyticsController({
      enqueueDailyRollup,
      getUsage: vi.fn(),
      getOverview: vi.fn(),
      getContentMetrics: vi.fn(),
    } as unknown as AnalyticsService);

    const method = Reflect.get(controller, 'rollup') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('llm-usage/rollup');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);

    await controller.rollup({ usageDate: '2026-03-09' } as never, { user: { id: 'admin-1' }, header: vi.fn() } as never);
    expect(enqueueDailyRollup).toHaveBeenCalled();
  });
});
