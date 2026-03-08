import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { SecurityEventType } from '@prisma/client';
import { AppRole } from '@api/common/auth/roles.enum';
import { Roles } from '@api/common/decorators/roles.decorator';
import { AuthenticatedRequest } from '@api/common/interfaces/authenticated-request.interface';
import { RequestRateLimitService } from '@api/common/security/request-rate-limit.service';
import { OpsService } from './ops.service';

@Roles(AppRole.ADMIN)
@Controller('v1/ops')
export class OpsController {
  constructor(
    private readonly opsService: OpsService,
    private readonly rateLimitService: RequestRateLimitService,
  ) {}

  @Get('runtime-status')
  runtimeStatus() {
    return this.opsService.runtimeStatus();
  }

  @Get('queue-metrics')
  queueMetrics() {
    return this.opsService.queueMetrics();
  }

  @Get('failed-jobs')
  failedJobs(@Query('limit') limit?: string) {
    return this.opsService.listFailedExecutions(limit ? Number(limit) : 50);
  }

  @Get('security-events')
  securityEvents(@Query('limit') limit?: string, @Query('eventType') eventType?: SecurityEventType) {
    return this.opsService.listSecurityEvents(limit ? Number(limit) : 50, eventType);
  }

  @Get('publication-failures')
  publicationFailures(@Query('limit') limit?: string) {
    return this.opsService.listFailedPublications(limit ? Number(limit) : 20);
  }

  @Post('failed-jobs/:executionId/replay')
  async replayFailedJob(
    @Param('executionId') executionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.rateLimitService.enforce(this.limitKey(req, executionId), 3, 60_000);
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.opsService.replayExecution(executionId, actorId);
  }

  @Post('publication-failures/:publicationId/retry')
  async retryPublication(
    @Param('publicationId') publicationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.rateLimitService.enforce(this.limitKey(req, publicationId), 3, 60_000);
    return this.opsService.retryFailedPublication(publicationId, req.user!);
  }

  private limitKey(req: AuthenticatedRequest, executionId: string) {
    return `replay:${req.ip}:${req.user?.id ?? 'anonymous'}:${executionId}`;
  }
}
