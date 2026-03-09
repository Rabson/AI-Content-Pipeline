import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { normalizeHttpError } from './http-error.util';

describe('normalizeHttpError', () => {
  it('maps validation payloads to status-aware code and preserves messages', () => {
    const error = new BadRequestException({
      message: ['brief must be shorter than or equal to 3000 characters'],
      error: 'Bad Request',
      statusCode: 400,
    });

    const result = normalizeHttpError(error);

    expect(result.status).toBe(400);
    expect(result.code).toBe('BAD_REQUEST');
    expect(result.message).toEqual([
      'brief must be shorter than or equal to 3000 characters',
    ]);
  });

  it('keeps explicit error code from custom payloads', () => {
    const error = new HttpException(
      {
        code: 'TOPIC_ALREADY_APPROVED',
        message: 'Topic already approved',
      },
      HttpStatus.CONFLICT,
    );

    const result = normalizeHttpError(error);
    expect(result.code).toBe('TOPIC_ALREADY_APPROVED');
    expect(result.message).toBe('Topic already approved');
  });

  it('normalizes unknown errors as internal server error', () => {
    const result = normalizeHttpError(new Error('Unexpected failure'));

    expect(result.status).toBe(500);
    expect(result.code).toBe('INTERNAL_SERVER_ERROR');
    expect(result.message).toBe('Unexpected failure');
  });
});
