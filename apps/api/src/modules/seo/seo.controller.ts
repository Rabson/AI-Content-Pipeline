import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { SeoService } from './seo.service';

@Roles(AppRole.EDITOR)
@Controller('v1/topics/:topicId/seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Post('generate')
  generate(
    @Param('topicId') topicId: string,
    @Body() dto: GenerateSeoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const actorId = req.user?.id ?? req.header('x-actor-id')?.trim() ?? 'system';
    return this.seoService.enqueue(topicId, dto, actorId);
  }

  @Get()
  latest(@Param('topicId') topicId: string) {
    return this.seoService.getLatest(topicId);
  }
}
