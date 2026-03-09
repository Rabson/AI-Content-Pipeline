import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkflowController } from '@api/modules/workflow/workflow.controller';
import { WorkflowService } from '@api/modules/workflow/workflow.service';

describe('WorkflowController endpoint transport', () => {
  const listTopicEvents = vi.fn().mockResolvedValue([]);

  afterEach(() => {
    listTopicEvents.mockClear();
  });

  it('maps workflow events route and delegates to service', async () => {
    const controller = new WorkflowController({
      listTopicEvents,
      listTopicRuns: vi.fn(),
    } as unknown as WorkflowService);

    const method = Reflect.get(controller, 'events') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('events');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.GET);

    await controller.events('topic-1');
    expect(listTopicEvents).toHaveBeenCalledWith('topic-1');
  });
});
