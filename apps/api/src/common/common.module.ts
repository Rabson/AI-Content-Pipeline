import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CasbinAuthorizationService } from './auth/casbin-authorization.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AppLogger } from './logger/app-logger.service';
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { RequestRateLimitService } from './security/request-rate-limit.service';
import { SecurityEventService } from './security/security-event.service';

@Global()
@Module({
  providers: [
    AppLogger,
    RequestRateLimitService,
    SecurityEventService,
    CasbinAuthorizationService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [
    AppLogger,
    RequestRateLimitService,
    SecurityEventService,
    CasbinAuthorizationService,
  ],
})
export class CommonModule {}
