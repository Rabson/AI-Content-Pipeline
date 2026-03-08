import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { StorageSigningService } from './storage-signing.service';
import { env } from '../../../config/env';

describe('StorageSigningService', () => {
  const service = new StorageSigningService();

  it('accepts allowed mime types within the size limit', () => {
    expect(() => service.validateUploadInput('diagram.png', 'image/png', 1024)).not.toThrow();
  });

  it('rejects unsupported mime types', () => {
    expect(() => service.validateUploadInput('payload.exe', 'application/x-msdownload', 1024)).toThrow(
      BadRequestException,
    );
  });

  it('rejects oversized uploads', () => {
    expect(() => service.validateUploadInput('big.pdf', 'application/pdf', env.storageMaxUploadBytes + 1)).toThrow(
      BadRequestException,
    );
  });
});
