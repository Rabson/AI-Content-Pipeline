import { DiscoverySuggestionCard } from '../../components/shared/discovery-suggestion-card';
import { TopicSummaryCard } from '../../components/shared/topic-summary-card';
import { getDiscoverySuggestions, getTopics } from '../../lib/api-client';
import { isPhaseEnabled } from '../../lib/feature-flags';
import { TopicCreateForm } from './topic-create-form';

export const dynamic = 'force-dynamic';

export default async function TopicsPage() {
  const phase3Enabled = isPhaseEnabled(3);
  const [topics, discovery] = await Promise.all([
    getTopics(),
    phase3Enabled ? getDiscoverySuggestions() : Promise.resolve({ suggestions: [] }),
  ]);

  return (
    <main className="page stack">
      <section className="grid-two">
        <div className="panel">
          <p className="eyebrow">Manual Intake</p>
          <h2>Create topic</h2>
          <p className="lede">This form feeds the manual topic creation path in the Topic Service.</p>
          <TopicCreateForm />
        </div>
        <div className="panel">
          <p className="eyebrow">Discovery</p>
          <h2>Suggested angles</h2>
          {phase3Enabled ? (
            <div className="list">
              {discovery.suggestions.map((item) => (
                <DiscoverySuggestionCard key={item.id} suggestion={item} />
              ))}
              {!discovery.suggestions.length ? <p className="empty-state">No suggestions yet.</p> : null}
            </div>
          ) : (
            <p className="empty-state">Phase 3 discovery is disabled in this environment.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Pipeline Queue</p>
            <h2>Topics</h2>
          </div>
          <span className="pill">{topics.length} records</span>
        </div>
        <div className="list">
          {topics.map((topic) => (
            <TopicSummaryCard key={topic.id} topic={topic} />
          ))}
          {!topics.length ? <p className="empty-state">No topics available.</p> : null}
        </div>
      </section>
    </main>
  );
}
