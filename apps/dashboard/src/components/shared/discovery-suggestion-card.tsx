import type { DiscoverySuggestionView } from '@aicp/contracts';
import { formatPercent, truncateText } from '../../lib/formatting';

export function DiscoverySuggestionCard({ suggestion }: { suggestion: DiscoverySuggestionView }) {
  return (
    <div className="list-item suggestion-card">
      <div className="topic-card-main">
        <div className="topic-card-header">
          <div>
            <p className="topic-kicker">Discovery Suggestion</p>
            <strong className="topic-card-title">{suggestion.title}</strong>
          </div>
          <div className="pill-row">
            <span className="pill pill-warning">{formatPercent(suggestion.confidence)}</span>
            <span className="pill pill-neutral">{suggestion.seedKeyword}</span>
          </div>
        </div>
        <p>{truncateText(suggestion.rationale, 180) || 'No rationale provided.'}</p>
      </div>
    </div>
  );
}
