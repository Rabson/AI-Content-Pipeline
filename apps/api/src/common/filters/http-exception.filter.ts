import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { env } from '@api/config/env';
import { AppLogger } from '../logger/app-logger.service';
import { redactSensitiveValues } from '../security/redact.util';
import { normalizeHttpError } from './http-error.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const normalized = normalizeHttpError(exception);
    const redacted = redactSensitiveValues(normalized.details);

    this.logger.error(
      {
        method: request.method,
        url: request.originalUrl,
        status: normalized.status,
        error: redacted,
      },
      undefined,
      'HttpExceptionFilter',
    );

    response.status(normalized.status).json({
      error:
        env.appEnv === 'local'
          ? {
              code: normalized.code,
              message: normalized.message,
              details: redacted,
            }
          : {
              code: normalized.code,
              message:
                normalized.status >= HttpStatus.INTERNAL_SERVER_ERROR
                  ? 'Internal server error'
                  : normalized.message,
              details: undefined,
            },
    });
  }
}
