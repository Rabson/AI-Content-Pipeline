import { NotFoundException } from '@nestjs/common';
import { RevisionRepository } from './revision.repository';
import { mapRevisionRun } from './mappers/revision.mapper';
import { GetDiffQueryDto } from './dto/get-diff-query.dto';

export async function getRevisionRunOrThrow(repository: RevisionRepository, revisionRunId: string) {
  const run = await repository.findRevisionRun(revisionRunId);
  if (!run) throw new NotFoundException('Revision run not found');
  return mapRevisionRun(run);
}

export async function getRevisionDiffOrThrow(repository: RevisionRepository, revisionRunId: string) {
  const run = await repository.findRevisionRun(revisionRunId);
  if (!run) throw new NotFoundException('Revision run not found');
  return { revisionRunId, sectionDiffs: run.sectionDiffs };
}

export async function compareDraftVersions(repository: RevisionRepository, topicId: string, query: GetDiffQueryDto) {
  if (!query.fromVersion || !query.toVersion) return { sectionDiffs: [] };
  const diffs = await repository.getDiffByVersions(topicId, query.fromVersion, query.toVersion);
  return { sectionDiffs: diffs };
}
