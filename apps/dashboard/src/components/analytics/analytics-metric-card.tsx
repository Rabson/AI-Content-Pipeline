export function AnalyticsMetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="stat-card">
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      <p className="topic-meta">{description}</p>
    </div>
  );
}
