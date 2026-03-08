import { InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { env } from '@api/config/env';
import { TokenCryptoService } from './token-crypto.service';

describe('TokenCryptoService', () => {
  const originalKey = env.userTokenEncryptionKey;

  it('encrypts and decrypts a token round-trip', () => {
    (env as { userTokenEncryptionKey: string }).userTokenEncryptionKey = 'test-key';
    const service = new TokenCryptoService();

    const encrypted = service.encrypt('secret-token');

    expect(encrypted).not.toBe('secret-token');
    expect(service.decrypt(encrypted)).toBe('secret-token');
  });

  it('rejects an invalid stored payload', () => {
    (env as { userTokenEncryptionKey: string }).userTokenEncryptionKey = 'test-key';
    const service = new TokenCryptoService();

    expect(() => service.decrypt('bad-payload')).toThrow(InternalServerErrorException);
  });

  it('requires an encryption key', () => {
    (env as { userTokenEncryptionKey: string }).userTokenEncryptionKey = '';
    const service = new TokenCryptoService();

    expect(() => service.encrypt('secret-token')).toThrow(InternalServerErrorException);
    (env as { userTokenEncryptionKey: string }).userTokenEncryptionKey = originalKey;
  });
});
