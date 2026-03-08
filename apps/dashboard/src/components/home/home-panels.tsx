import Link from 'next/link';
import type { DiscoverySuggestionView, TopicSummary } from '@aicp/contracts';
import { DiscoverySuggestionCard } from '../shared/discovery-suggestion-card';
import { TopicSummaryCard } from '../shared/topic-summary-card';

export function RecentTopicsPanel({ topics }: { topics: TopicSummary[] }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Recent topics</h3>
        <Link href="/topics">See all</Link>
      </div>
      <div className="list">
        {topics.slice(0, 6).map((topic) => (
          <TopicSummaryCard key={topic.id} topic={topic} />
        ))}
        {!topics.length ? <p className="empty-state">No topics returned from API yet.</p> : null}
      </div>
    </div>
  );
}

export function DiscoveryPanel({ suggestions }: { suggestions: DiscoverySuggestionView[] }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Discovery suggestions</h3>
      </div>
      <div className="list">
        {suggestions.map((suggestion) => (
          <DiscoverySuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
        {!suggestions.length ? (
          <p className="empty-state">Discovery suggestions appear after the API has topic history.</p>
        ) : null}
      </div>
    </div>
  );
}
