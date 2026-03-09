import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLogger } from '../logger/app-logger.service';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { getRequestContext } from '../request-context/request-context.store';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse();
    const { method, originalUrl } = request;
    const actorId = request.user?.id || request.header('x-actor-id') || 'anonymous';
    const requestContext = getRequestContext();
    const requestId = requestContext?.requestId ?? null;
    const traceId = requestContext?.traceId ?? null;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            {
              method,
              originalUrl,
              actorId,
              requestId,
              traceId,
              statusCode: response.statusCode,
              durationMs: Date.now() - now,
            },
            'RequestLoggingInterceptor',
          );
        },
      }),
    );
  }
}
