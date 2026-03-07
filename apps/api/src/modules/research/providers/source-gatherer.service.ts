import { Injectable } from '@nestjs/common';

export interface GatheredSource {
  id: string;
  url: string;
  title?: string;
  excerpt?: string;
  snippets?: string[];
}

@Injectable()
export class SourceGathererService {
  async gatherFromTopic(topic: { title: string; brief: string | null }): Promise<GatheredSource[]> {
    // Placeholder: replace with fetchers/crawlers/manual-source adapters.
    return [
      {
        id: 'src_topic_context',
        url: 'https://internal.local/topic-context',
        title: `${topic.title} - internal notes`,
        excerpt: topic.brief ?? undefined,
        snippets: topic.brief ? [topic.brief] : [],
      },
    ];
  }
}
