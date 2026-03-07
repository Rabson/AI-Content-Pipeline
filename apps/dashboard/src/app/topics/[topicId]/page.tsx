import { DistributionPanels } from '../../../components/topic-detail/distribution-panels';
import { TopicPipelineSnapshot } from '../../../components/topic-detail/topic-pipeline-snapshot';
import { loadTopicOverviewData } from '../../../components/topic-detail/topic-overview-data';
import { TopicSummarySection } from '../../../components/topic-detail/topic-summary-section';
import { isPhaseEnabled } from '../../../lib/feature-flags';

export const dynamic = 'force-dynamic';

function TopicNotFoundState() {
  return (
    <main className="page">
      <div className="panel">Topic not found or API is unavailable.</div>
    </main>
  );
}

export default async function TopicOverviewPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const phase2Enabled = isPhaseEnabled(2);
  const { topic, research, draft, seo, social, publications } = await loadTopicOverviewData(topicId, phase2Enabled);

  if (!topic) {
    return <TopicNotFoundState />;
  }

  return (
    <main className="page stack">
      <TopicSummarySection topic={topic} topicId={topicId} />
      <TopicPipelineSnapshot research={research} draft={draft} social={social} publications={publications} />
      <DistributionPanels seo={seo} social={social} />
    </main>
  );
}
