import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const errorMessage =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : {
            message:
              exception instanceof Error ? exception.message : 'Internal server error',
          };

    this.logger.error(
      {
        method: request.method,
        url: request.originalUrl,
        error: errorMessage,
      },
      undefined,
      'HttpExceptionFilter',
    );

    response.status(status).json({
      error: {
        code:
          typeof errorMessage === 'object' && errorMessage !== null && 'code' in errorMessage
            ? (errorMessage as { code?: string }).code ?? 'UNHANDLED_ERROR'
            : 'UNHANDLED_ERROR',
        message:
          typeof errorMessage === 'object' && errorMessage !== null && 'message' in errorMessage
            ? (errorMessage as { message?: string }).message ?? 'Unknown error'
            : 'Unknown error',
        details: errorMessage,
      },
    });
  }
}
