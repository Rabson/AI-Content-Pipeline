import { describe, expect, it, vi } from 'vitest';
import { RevisionService } from '../../src/modules/revision/revision.service';

describe('Revision Section-only Guarantees (e2e)', () => {
  it('revises only selected sections and preserves non-selected sections', async () => {
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
            { sectionKey: 'sec_intro', heading: 'Intro', contentMd: 'Intro body' },
            { sectionKey: 'sec_core', heading: 'Core', contentMd: 'Core body' },
            { sectionKey: 'sec_practice', heading: 'Practice', contentMd: 'Practice body' },
          ],
        },
        comments: [{ sectionKey: 'sec_core', commentMd: 'Strengthen the core section' }],
      }),
      findActiveRevisionRun: vi.fn().mockResolvedValue(null),
      createRevisionRun: vi.fn().mockResolvedValue({
        revisionRun: {
          id: 'rev-1',
          items: [{ id: 'item-core', sectionKey: 'sec_core', instructionMd: 'Revise only core' }],
        },
        toDraft: { id: 'draft-v2' },
      }),
    } as any;

    const service = new RevisionService(repository, { transitionContentState: vi.fn() } as any, queue);
    await service.enqueueRevision(
      'review-1',
      { items: [{ sectionKey: 'sec_core', instructionMd: 'Revise only core' }] } as any,
      'reviewer-1',
    );

    const sectionJobs = queue.add.mock.calls.filter((call: any[]) => call[0] === 'revision.apply.section');
    expect(sectionJobs).toHaveLength(1);
    expect(sectionJobs[0][1].sectionKey).toBe('sec_core');
  });
});
