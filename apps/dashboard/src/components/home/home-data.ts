import { getDiscoverySuggestions, getTopics } from '../../lib/api-client';
import type { DiscoverySuggestionView } from '@aicp/contracts';

export async function loadHomePageData() {
  const [topics, discovery] = await Promise.all([getTopics(), getDiscoverySuggestions()]);
  return { topics, suggestions: discovery.suggestions };
}

export function getAverageConfidence(suggestions: DiscoverySuggestionView[]) {
  if (!suggestions.length) {
    return 0;
  }

  const total = suggestions.reduce((sum, suggestion) => sum + suggestion.confidence, 0);
  return total / suggestions.length;
}
