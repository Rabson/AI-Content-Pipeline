import type { AnalyticsUsageView } from '@aicp/contracts';
import { formatUsd } from '../../lib/formatting';

function UsageRow({ item, maxTokens }: { item: AnalyticsUsageView; maxTokens: number }) {
  return (
    <div className="chart-row">
      <span>
        {item.usageDate.slice(0, 10)} · {item.module}
      </span>
      <div className="bar" style={{ width: `${Math.max(8, (item.totalTokens / maxTokens) * 100)}%` }} />
      <span>
        {item.totalTokens} tokens · {formatUsd(item.estimatedCostUsd)}
      </span>
    </div>
  );
}

function EmptyUsageState() {
  return (
    <div className="list-item">
      <div>
        <strong>No LLM usage logged yet</strong>
        <p>The pipeline has not produced research, draft, revision, or social artifacts with tracked token usage in this environment.</p>
      </div>
      <span className="pill">0 tokens</span>
    </div>
  );
}

export function UsagePanel({ usage }: { usage: AnalyticsUsageView[] }) {
  const maxTokens = Math.max(...usage.map((item) => item.totalTokens), 1);

  return (
    <div className="panel">
      <h3>LLM usage</h3>
      <div className="list">
        {usage.map((item) => (
          <UsageRow key={`${item.usageDate}-${item.module}-${item.model}`} item={item} maxTokens={maxTokens} />
        ))}
        {!usage.length ? <EmptyUsageState /> : null}
      </div>
    </div>
  );
}
