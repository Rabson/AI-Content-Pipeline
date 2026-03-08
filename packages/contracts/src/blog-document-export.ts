import type {
  DraftVersionView,
  LinkedInDraftView,
  PublicationView,
  ResearchArtifactView,
  SeoMetadataView,
  TopicDetail,
} from './api';
import type { BlogAuthor, BlogDocument, BlogPlatformTransforms, BlogSection } from './blog-document';

export interface BlogDocumentExportSource {
  topic: Pick<TopicDetail, 'id' | 'title' | 'slug' | 'brief' | 'status' | 'tags' | 'createdAt' | 'updatedAt'>;
  draft: Pick<DraftVersionView, 'id' | 'versionNumber' | 'assembledMarkdown' | 'sections'>;
  research?: ResearchArtifactView | null;
  seo?: SeoMetadataView | null;
  linkedin?: LinkedInDraftView | null;
  publications?: PublicationView[];
  author?: BlogAuthor;
  category?: string;
  readingTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogDocumentStorageMapping {
  sourceOfTruth: {
    topic: 'Topic';
    draftVersion: 'DraftVersion';
    draftSections: 'DraftSection';
    research: 'ResearchArtifact';
    seo: 'SeoMetadata';
    social: 'SocialPost | SocialPostVersion';
    publications: 'Publication | PublicationAttempt';
  };
  assembledFields: {
    root: Array<keyof BlogDocument>;
    sections: Array<keyof BlogSection>;
    transforms: Array<keyof NonNullable<BlogPlatformTransforms>>;
  };
}

export const BLOG_DOCUMENT_STORAGE_MAPPING: BlogDocumentStorageMapping = {
  sourceOfTruth: {
    topic: 'Topic',
    draftVersion: 'DraftVersion',
    draftSections: 'DraftSection',
    research: 'ResearchArtifact',
    seo: 'SeoMetadata',
    social: 'SocialPost | SocialPostVersion',
    publications: 'Publication | PublicationAttempt',
  },
  assembledFields: {
    root: ['id', 'type', 'title', 'summary', 'slug', 'status', 'version', 'sections', 'createdAt', 'updatedAt'],
    sections: ['id', 'title', 'order', 'status', 'blocks'],
    transforms: ['devto', 'linkedin'],
  },
};
