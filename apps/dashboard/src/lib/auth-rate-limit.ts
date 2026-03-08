import { getRedisClient } from './redis-client';

const authRateLimitFallback = new Map<string, { count: number; resetAt: number }>();

function enforceFallback(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = authRateLimitFallback.get(key);
  if (!current || current.resetAt <= now) {
    authRateLimitFallback.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new Error('Too many sign-in attempts. Try again later.');
  }
  current.count += 1;
}

export async function enforceAuthRateLimit(key: string, limit: number, windowMs: number) {
  const redis = getRedisClient();
  if (!redis) {
    enforceFallback(key, limit, windowMs);
    return;
  }

  try {
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.pexpire(key, windowMs);
    }
    if (attempts > limit) {
      throw new Error('Too many sign-in attempts. Try again later.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Too many sign-in attempts')) {
      throw error;
    }
    enforceFallback(key, limit, windowMs);
  }
}

export async function clearAuthRateLimit(key: string) {
  const redis = getRedisClient();
  authRateLimitFallback.delete(key);
  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch {
    return;
  }
}
