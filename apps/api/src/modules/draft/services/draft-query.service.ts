import { Injectable, NotFoundException } from '@nestjs/common';
import { mapDraftVersion } from '../mappers/draft.mapper';
import { GetDraftQueryDto } from '../dto/get-draft-query.dto';
import { ListDraftVersionsDto } from '../dto/list-draft-versions.dto';
import { DraftRepository } from '../draft.repository';

@Injectable()
export class DraftQueryService {
  constructor(private readonly repository: DraftRepository) {}

  listDraftVersions(topicId: string, query: ListDraftVersionsDto) {
    const skip = (query.page - 1) * query.limit;
    return this.repository.listDraftVersions(topicId, skip, query.limit);
  }

  async getDraft(topicId: string, query: GetDraftQueryDto) {
    const draft = await this.loadDraft(topicId, query);
    return mapDraftVersion(draft);
  }

  async getDraftMarkdown(topicId: string, query: GetDraftQueryDto) {
    const draft = await this.loadDraft(topicId, query);
    return {
      draftVersionId: draft.id,
      versionNumber: draft.versionNumber,
      markdown: draft.assembledMarkdown,
    };
  }

  async getDraftSection(topicId: string, sectionKey: string, query: GetDraftQueryDto) {
    const draft = await this.loadDraft(topicId, query);
    const section = draft.sections.find((item) => item.sectionKey === sectionKey);
    if (!section) {
      throw new NotFoundException('Draft section not found');
    }

    return {
      draftVersionId: draft.id,
      versionNumber: draft.versionNumber,
      section,
      comments: await this.repository.listSectionComments(draft.id, sectionKey),
    };
  }

  listReviewSessions(topicId: string) {
    return this.repository.listReviewSessions(topicId);
  }

  private async loadDraft(topicId: string, query: GetDraftQueryDto) {
    const draft = query.version
      ? await this.repository.getDraftByVersion(topicId, query.version)
      : await this.repository.getLatestDraft(topicId);

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    return draft;
  }
}
