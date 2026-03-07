export function mapRevisionRun(run: any) {
  return {
    id: run.id,
    topicId: run.topicId,
    status: run.status,
    fromDraftVersionId: run.fromDraftVersionId,
    toDraftVersionId: run.toDraftVersionId,
    items: run.items,
    sectionDiffs: run.sectionDiffs,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
  };
}
