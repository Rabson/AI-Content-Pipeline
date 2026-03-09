export const DRAFT_FAILURE_WRITER = Symbol('DRAFT_FAILURE_WRITER');
export const OUTLINE_FAILURE_WRITER = Symbol('OUTLINE_FAILURE_WRITER');
export const REVISION_FAILURE_WRITER = Symbol('REVISION_FAILURE_WRITER');

export interface DraftFailureWriter {
  markDraftFailed(draftVersionId: string): Promise<unknown>;
}

export interface OutlineFailureWriter {
  markFailed(topicId: string, reason: string): Promise<unknown>;
}

export interface RevisionFailureWriter {
  markRevisionRunFailed(revisionRunId: string, reason: string): Promise<unknown>;
}
