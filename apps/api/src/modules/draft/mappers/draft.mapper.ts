export function mapDraftVersion(draft: any) {
  return {
    id: draft.id,
    topicId: draft.topicId,
    versionNumber: draft.versionNumber,
    status: draft.status,
    assembledMarkdown: draft.assembledMarkdown,
    sections: draft.sections,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}
