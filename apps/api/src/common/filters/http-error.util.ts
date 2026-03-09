import { HttpException, HttpStatus } from '@nestjs/common';

interface ErrorPayload {
  status: number;
  code: string;
  message: string | string[];
  details: Record<string, unknown>;
}

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

export function normalizeHttpError(exception: unknown): ErrorPayload {
  const status = exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
  const details = readDetails(exception);
  const code = readCode(details, status);
  const message = readMessage(details, exception, status);
  return { status, code, message, details };
}

function readDetails(exception: unknown): Record<string, unknown> {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null) {
      return response as Record<string, unknown>;
    }
    return { message: response };
  }

  if (exception instanceof Error) {
    return { message: exception.message };
  }

  return { message: 'Internal server error' };
}

function readCode(details: Record<string, unknown>, status: number): string {
  const explicitCode = details.code;
  if (typeof explicitCode === 'string' && explicitCode.trim()) {
    return explicitCode;
  }

  if (STATUS_CODE_MAP[status]) {
    return STATUS_CODE_MAP[status];
  }

  return 'UNHANDLED_ERROR';
}

function readMessage(
  details: Record<string, unknown>,
  exception: unknown,
  status: number,
): string | string[] {
  const message = details.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    const normalized = message
      .map((entry) => String(entry).trim())
      .filter(Boolean);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  if (exception instanceof Error && exception.message.trim()) {
    return exception.message;
  }

  if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
    return 'Internal server error';
  }

  return 'Request failed';
}
