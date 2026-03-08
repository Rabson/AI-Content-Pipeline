import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../../config/env';

@Injectable()
export class RequestRateLimitService {
  private readonly entries = new Map<string, { count: number; resetAt: number }>();
  private readonly redis = env.redisUrl
    ? new Redis(env.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
      })
    : null;

  async enforce(key: string, limit: number, windowMs: number) {
    if (this.redis) {
      try {
        const attempts = await this.redis.incr(key);
        if (attempts === 1) {
          await this.redis.pexpire(key, windowMs);
        }
        if (attempts > limit) {
          throw new HttpException('Too many requests for this operation', HttpStatus.TOO_MANY_REQUESTS);
        }
        return;
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
      }
    }

    const now = Date.now();
    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (current.count >= limit) {
      throw new HttpException('Too many requests for this operation', HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
  }
}
