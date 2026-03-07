export function mapResearchArtifact(artifact: any) {
  return {
    id: artifact.id,
    topicId: artifact.topicId,
    summary: artifact.summary,
    confidenceScore: artifact.confidenceScore?.toString?.() ?? null,
    keyPoints: artifact.keyPoints,
    examples: artifact.examples,
    sources: artifact.sources,
    version: artifact.artifactVersion?.versionNumber,
    createdAt: artifact.createdAt,
  };
}
