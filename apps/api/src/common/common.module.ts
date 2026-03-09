import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CasbinAuthorizationService } from './auth/casbin-authorization.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AppLogger } from './logger/app-logger.service';
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { PrismaService } from '@api/prisma/prisma.service';
import { RequestRateLimitService } from './security/request-rate-limit.service';
import { SecurityEventRepository } from './security/security-event.repository';
import {
  SECURITY_EVENT_RUNTIME_CONFIG,
  SecurityEventService,
} from './security/security-event.service';
import { env } from '@api/config/env';
import { RequestContextMiddleware } from './request-context/request-context.middleware';

@Global()
@Module({
  providers: [
    PrismaService,
    AppLogger,
    RequestContextMiddleware,
    RequestRateLimitService,
    SecurityEventRepository,
    {
      provide: SECURITY_EVENT_RUNTIME_CONFIG,
      useValue: {
        securityAlertThreshold: env.securityAlertThreshold,
        securityAlertWindowMs: env.securityAlertWindowMs,
      },
    },
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
