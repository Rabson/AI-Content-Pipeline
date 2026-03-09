import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Queue, QueueEvents, Worker } from 'bullmq';
import Redis from 'ioredis';
import {
  canConnectToRedis,
  closeQueueResources,
  drainQueue,
  integrationRedisUrl,
  waitForQueueEvent,
} from './bullmq-integration.helpers';

describe('BullMQ Redis integration', () => {
  const redisUrl = integrationRedisUrl();
  let redisAvailable = false;
  let queueCounter = 0;

  beforeAll(async () => {
    redisAvailable = await canConnectToRedis(redisUrl);
  });

  afterEach(async () => {
    if (!redisAvailable) return;
    const queueName = `worker.integration.${queueCounter}`;
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    await drainQueue(queueName, connection);
    connection.disconnect();
  });

  it('retries failed jobs and eventually completes with backoff', async () => {
    queueCounter += 1;
    if (!redisAvailable) return;

    const queueName = `worker.integration.${queueCounter}`;
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    let attempts = 0;
    const queue = new Queue(queueName, { connection });
    const events = new QueueEvents(queueName, { connection });
    const worker = new Worker(
      queueName,
      async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('transient');
        return { ok: true };
      },
      { connection },
    );

    await events.waitUntilReady();
    const job = await queue.add('retryable.job', {}, { attempts: 2, backoff: { type: 'fixed', delay: 25 } });
    await waitForQueueEvent(events, 'completed', String(job.id));
    await closeQueueResources([worker, events, queue]);
    connection.disconnect();
    expect(attempts).toBe(2);
  });

  it('replays failed jobs via retry and processes successfully', async () => {
    queueCounter += 1;
    if (!redisAvailable) return;

    const queueName = `worker.integration.${queueCounter}`;
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    const queue = new Queue(queueName, { connection });
    const events = new QueueEvents(queueName, { connection });
    const failingWorker = new Worker(queueName, async () => {
      throw new Error('first pass fails');
    }, { connection });

    await events.waitUntilReady();
    const job = await queue.add('replay.job', {}, { attempts: 1 });
    await waitForQueueEvent(events, 'failed', String(job.id));
    await failingWorker.close();

    let replayAttempts = 0;
    const recoveryWorker = new Worker(queueName, async () => {
      replayAttempts += 1;
      return { replayed: true };
    }, { connection });
    const failedJob = await queue.getJob(String(job.id));
    await failedJob?.retry();
    await waitForQueueEvent(events, 'completed', String(job.id));
    await closeQueueResources([recoveryWorker, events, queue]);
    connection.disconnect();
    expect(replayAttempts).toBe(1);
  });
});
