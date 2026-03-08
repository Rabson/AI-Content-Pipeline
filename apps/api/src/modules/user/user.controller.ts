import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AppRole } from '../../common/auth/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UserAccountService } from './services/user-account.service';

@Controller('v1/users')
export class UserController {
  constructor(private readonly accountService: UserAccountService) {}

  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.accountService.getUser(req.user?.id ?? '');
  }

  @Roles(AppRole.ADMIN)
  @Get()
  list() {
    return this.accountService.listUsers();
  }

  @Roles(AppRole.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.accountService.createUser(dto);
  }
}
