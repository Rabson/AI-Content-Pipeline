import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RequestRateLimitService } from '../../common/security/request-rate-limit.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { StorageService } from './storage.service';

@Roles(AppRole.EDITOR)
@Controller('v1/topics/:topicId/assets')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly rateLimitService: RequestRateLimitService,
  ) {}

  @Post('presign-upload')
  createUploadUrl(
    @Param('topicId') topicId: string,
    @Body() dto: CreateUploadUrlDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.rateLimitService.enforce(this.limitKey(req, topicId), 10, 60_000);
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.storageService.createUploadUrl(topicId, dto, actorId);
  }

  private limitKey(req: AuthenticatedRequest, topicId: string) {
    return `upload:${req.ip}:${req.user?.id ?? 'anonymous'}:${topicId}`;
  }
}
