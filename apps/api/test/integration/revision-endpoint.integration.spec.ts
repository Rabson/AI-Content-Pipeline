import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RevisionController } from '@api/modules/revision/revision.controller';
import { RevisionService } from '@api/modules/revision/revision.service';

describe('RevisionController endpoint transport', () => {
  const enqueueRevision = vi.fn().mockResolvedValue({ revisionRunId: 'run-1' });

  afterEach(() => {
    enqueueRevision.mockClear();
  });

  it('maps revision run route and delegates to service', async () => {
    const controller = new RevisionController({
      enqueueRevision,
      getRevisionRun: vi.fn(),
      listRevisionRuns: vi.fn(),
      getRevisionDiff: vi.fn(),
      compareDraftVersions: vi.fn(),
    } as unknown as RevisionService);

    const method = Reflect.get(controller, 'runRevision') as object;
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe('reviews/:reviewSessionId/revisions/run');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.POST);

    await controller.runRevision('review-1', {} as never, { user: { id: 'reviewer-1' }, header: vi.fn() } as never);
    expect(enqueueRevision).toHaveBeenCalled();
  });
});
