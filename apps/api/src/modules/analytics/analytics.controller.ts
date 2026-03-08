import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AppRole } from '@api/common/auth/roles.enum';
import { Roles } from '@api/common/decorators/roles.decorator';
import { AuthenticatedRequest } from '@api/common/interfaces/authenticated-request.interface';
import { AnalyticsService } from './analytics.service';
import { AnalyticsOverviewQueryDto } from './dto/analytics-overview-query.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { RunRollupDto } from './dto/run-rollup.dto';

@Roles(AppRole.ADMIN)
@Controller('v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('llm-usage/rollup')
  rollup(@Body() dto: RunRollupDto, @Req() req: AuthenticatedRequest) {
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.analyticsService.enqueueDailyRollup(dto, actorId);
  }

  @Get('llm-usage')
  usage(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getUsage(query);
  }

  @Get('overview')
  overview(@Query() query: AnalyticsOverviewQueryDto) {
    return this.analyticsService.getOverview(query.days);
  }

  @Get('topics/:contentItemId')
  topicMetrics(@Param('contentItemId') contentItemId: string) {
    return this.analyticsService.getContentMetrics(contentItemId);
  }
}
