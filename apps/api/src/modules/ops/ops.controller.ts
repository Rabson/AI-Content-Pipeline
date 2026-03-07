import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { OpsService } from './ops.service';

@Roles(AppRole.ADMIN)
@Controller('v1/ops')
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

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

  @Post('failed-jobs/:executionId/replay')
  replayFailedJob(
    @Param('executionId') executionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.opsService.replayExecution(executionId, actorId);
  }
}
