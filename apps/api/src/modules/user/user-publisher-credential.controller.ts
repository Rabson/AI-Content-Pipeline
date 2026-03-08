import { Controller, Delete, Get, Param, ParseEnumPipe, Put, Req, Body } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { AuthenticatedRequest } from '@api/common/interfaces/authenticated-request.interface';
import { UpsertUserPublisherCredentialDto } from './dto/upsert-user-publisher-credential.dto';
import { UserPublisherCredentialService } from './services/user-publisher-credential.service';

@Controller('v1/users/me/publisher-credentials')
export class UserPublisherCredentialController {
  constructor(private readonly credentialService: UserPublisherCredentialService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.credentialService.listOwn(req.user?.id ?? '');
  }

  @Put(':channel')
  upsert(
    @Req() req: AuthenticatedRequest,
    @Param('channel', new ParseEnumPipe(PublicationChannel)) channel: PublicationChannel,
    @Body() dto: UpsertUserPublisherCredentialDto,
  ) {
    return this.credentialService.upsertOwn(req.user!, channel, dto);
  }

  @Delete(':channel')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('channel', new ParseEnumPipe(PublicationChannel)) channel: PublicationChannel,
  ) {
    return this.credentialService.deleteOwn(req.user!, channel);
  }
}
