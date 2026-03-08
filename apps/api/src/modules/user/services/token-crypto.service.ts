import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { env } from '../../../config/env';

@Injectable()
export class TokenCryptoService {
  encrypt(token: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv, authTag, encrypted].map((part) => part.toString('base64url')).join('.');
  }

  decrypt(payload: string) {
    const [iv, authTag, encrypted] = payload.split('.').map((part) => Buffer.from(part, 'base64url'));
    if (!iv || !authTag || !encrypted) {
      throw new InternalServerErrorException('Stored publisher credential is invalid');
    }

    const decipher = createDecipheriv('aes-256-gcm', this.key(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  private key() {
    const seed = env.userTokenEncryptionKey?.trim();
    if (!seed) {
      throw new InternalServerErrorException('USER_TOKEN_ENCRYPTION_KEY is not configured');
    }
    return createHash('sha256').update(seed).digest();
  }
}
