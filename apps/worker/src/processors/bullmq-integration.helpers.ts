import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import type { Redis as RedisClient } from 'ioredis';

export function integrationRedisUrl() {
  return process.env.WORKER_TEST_REDIS_URL ?? process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
}

export async function canConnectToRedis(url: string) {
  const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await redis.connect();
    await redis.ping();
    return true;
  } catch {
    return false;
  } finally {
    redis.disconnect();
  }
}

export async function waitForQueueEvent(
  events: QueueEvents,
  eventName: 'completed' | 'failed',
  jobId: string,
  timeoutMs = 6000,
) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      events.off(eventName, handler as any);
      reject(new Error(`Timed out waiting for ${eventName} for job ${jobId}`));
    }, timeoutMs);
    const handler = (payload: Record<string, unknown>) => {
      if (String(payload.jobId ?? '') !== String(jobId)) return;
      clearTimeout(timeout);
      events.off(eventName, handler as any);
      resolve(payload);
    };
    events.on(eventName, handler as any);
  });
}

export async function closeQueueResources(resources: Array<{ close(): Promise<void> }>) {
  await Promise.all(resources.map((resource) => resource.close()));
}

export async function drainQueue(queueName: string, connection: RedisClient) {
  const queue = new Queue(queueName, { connection });
  try {
    await queue.drain(true);
    await queue.obliterate({ force: true });
  } finally {
    await queue.close();
  }
}
