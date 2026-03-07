import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthClient {
  async check() {
    const url = process.env.REDIS_URL;
    if (!url) {
      return { ok: false, error: 'REDIS_URL not configured' };
    }

    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    try {
      await client.connect();
      const pong = await client.ping();
      return { ok: pong === 'PONG' };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Redis check failed',
      };
    } finally {
      client.disconnect();
    }
  }
}
