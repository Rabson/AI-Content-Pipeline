import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_QUEUE,
  CONTENT_PIPELINE_QUEUE,
  DISCOVERY_IMPORT_JOB,
  JobName,
  PUBLISHING_QUEUE,
  QueueName,
  SOCIAL_QUEUE,
} from './job-constants';

describe('job-constants', () => {
  it('keeps queue names stable', () => {
    const queues: QueueName[] = [CONTENT_PIPELINE_QUEUE, PUBLISHING_QUEUE, SOCIAL_QUEUE, ANALYTICS_QUEUE];
    expect(queues).toEqual(['content.pipeline', 'publishing', 'social', 'analytics']);
  });

  it('exports valid job names', () => {
    const discoveryJob: JobName = DISCOVERY_IMPORT_JOB;
    expect(discoveryJob).toBe('discovery.import');
  });
});
