import { describe, expect, it, vi } from 'vitest';
import { RevisionService } from '../revision.service';

const workflowServiceMock = () => ({
  transitionContentState: vi.fn(),
});

describe('RevisionService', () => {
  it('enqueues section-only revision jobs from review comments', async () => {
    const queue = {
      add: vi.fn().mockResolvedValue({ id: 'job-1' }),
    } as any;
    const repository = {
      findReviewSession: vi.fn().mockResolvedValue({
        id: 'review-1',
        topicId: 'topic-1',
        topic: { title: 'Topic' },
        draftVersionId: 'draft-v1',
        draftVersion: {
          sections: [
            { sectionKey: 'intro', heading: 'Intro', contentMd: 'A' },
            { sectionKey: 'core', heading: 'Core', contentMd: 'B' },
          ],
        },
        comments: [{ sectionKey: 'core', commentMd: 'Tighten the argument' }],
      }),
      findActiveRevisionRun: vi.fn().mockResolvedValue(null),
      createRevisionRun: vi.fn().mockResolvedValue({
        revisionRun: {
          id: 'rev-1',
          items: [{ id: 'item-1', sectionKey: 'core', instructionMd: 'Revise core' }],
        },
        toDraft: { id: 'draft-v2' },
      }),
      getDiffByVersions: vi.fn(),
      findRevisionRun: vi.fn(),
    } as any;

    const service = new RevisionService(repository, workflowServiceMock() as any, queue);
    const result = await service.enqueueRevision(
      'review-1',
      { items: [{ sectionKey: 'core', instructionMd: 'Revise core' }] } as any,
      'reviewer-1',
    );

    expect(result.revisionRunId).toBe('rev-1');
    expect(queue.add).toHaveBeenCalledTimes(3);
    expect(queue.add).toHaveBeenCalledWith(
      'revision.apply.section',
      expect.objectContaining({ sectionKey: 'core' }),
      expect.anything(),
    );
  });

  it('returns per-section diffs', async () => {
    const repository = {
      findRevisionRun: vi.fn().mockResolvedValue({
        sectionDiffs: [{ sectionKey: 'core', diffUnifiedMd: '-a\n+b' }],
      }),
    } as any;

    const service = new RevisionService(repository, workflowServiceMock() as any, {} as any);
    const result = await service.getRevisionDiff('rev-1');

    expect(result.sectionDiffs).toHaveLength(1);
  });
});
