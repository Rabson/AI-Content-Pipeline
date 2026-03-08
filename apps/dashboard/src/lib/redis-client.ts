import Redis from 'ioredis';
import { env } from '../config/env';

let redisClient: Redis | null = null;

export function getRedisClient() {
  if (!env.redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
  }

  return redisClient;
}
