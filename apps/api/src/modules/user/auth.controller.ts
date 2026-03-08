import { Body, Controller, Post, Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RequestRateLimitService } from '../../common/security/request-rate-limit.service';
import { LoginUserDto } from './dto/login-user.dto';
import { UserAuthService } from './services/user-auth.service';

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: UserAuthService,
    private readonly rateLimitService: RequestRateLimitService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginUserDto, @Req() req: AuthenticatedRequest) {
    this.rateLimitService.enforce(this.limitKey(dto.email, req.ip ?? 'local'), 5, 10 * 60 * 1000);
    return this.authService.login(dto.email, dto.password);
  }

  private limitKey(email: string, ip: string) {
    return `user-login:${email.trim().toLowerCase()}:${ip}`;
  }
}
