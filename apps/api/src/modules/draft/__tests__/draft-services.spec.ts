import { describe, expect, it, vi } from 'vitest';
import { DraftGenerationService } from '../services/draft-generation.service';
import { DraftReviewService } from '../services/draft-review.service';

const workflowServiceMock = () => ({
  setCurrentDraft: vi.fn(),
  transitionContentState: vi.fn(),
  recordEvent: vi.fn(),
  markApprovedDraft: vi.fn(),
});

describe('Draft services', () => {
  it('enqueues section-by-section generation jobs', async () => {
    const queue = {
      add: vi.fn().mockResolvedValue({ id: 'job-1' }),
    } as any;
    const repository = {
      findTopicById: vi.fn().mockResolvedValue({ id: 'topic-1', title: 'Topic', brief: 'Brief' }),
      findInProgressDraft: vi.fn().mockResolvedValue(null),
      getLatestOutline: vi.fn().mockResolvedValue({
        sections: [
          { sectionKey: 'intro', heading: 'Intro', position: 1, objective: 'Context', targetWords: 200 },
          { sectionKey: 'core', heading: 'Core', position: 2, objective: 'Core', targetWords: 300 },
        ],
      }),
      createDraftShell: vi.fn().mockResolvedValue({ id: 'draft-1', versionNumber: 1 }),
    } as any;

    const service = new DraftGenerationService(repository, workflowServiceMock() as any, queue);
    const result = await service.enqueueDraftGeneration('topic-1', {}, 'editor-1');

    expect(result.versionNumber).toBe(1);
    expect(queue.add).toHaveBeenCalledTimes(4);
  });

  it('creates review comments mapped to section keys', async () => {
    const repository = {
      findReviewSession: vi.fn().mockResolvedValue({
        id: 'review-1',
        topicId: 'topic-1',
        draftVersionId: 'draft-1',
        draftVersion: { topicId: 'topic-1' },
      }),
      createReviewComment: vi.fn().mockResolvedValue({ id: 'comment-1', sectionKey: 'intro' }),
    } as any;

    const service = new DraftReviewService(repository, workflowServiceMock() as any);
    const result = await service.createReviewComment(
      'review-1',
      { sectionKey: 'intro', commentMd: 'Tighten intro', severity: 'MAJOR' } as any,
      'reviewer-1',
    );

    expect(result.sectionKey).toBe('intro');
    expect(repository.createReviewComment).toHaveBeenCalledWith(
      expect.objectContaining({
        sectionKey: 'intro',
        actorId: 'reviewer-1',
      }),
    );
  });
});
