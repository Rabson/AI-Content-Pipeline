import { DiscoveryPanel, RecentTopicsPanel } from '../components/home/home-panels';
import { getAverageConfidence, loadHomePageData } from '../components/home/home-data';
import { HeroSection } from '../components/home/hero-section';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { topics, suggestions } = await loadHomePageData();
  const scoredTopics = topics.filter((topic) => topic.scoreTotal !== null && topic.scoreTotal !== undefined);
  const approvedTopics = topics.filter((topic) => topic.status === 'APPROVED' || topic.status === 'RESEARCH_READY');
  const blockedTopics = topics.filter((topic) => topic.status === 'REJECTED' || topic.status === 'FAILED');

  return (
    <main className="page">
      <HeroSection
        topicCount={topics.length}
        scoredCount={scoredTopics.length}
        approvedCount={approvedTopics.length}
        blockedCount={blockedTopics.length}
        averageConfidence={getAverageConfidence(suggestions)}
      />
      <section className="grid-two">
        <RecentTopicsPanel topics={topics} />
        <DiscoveryPanel suggestions={suggestions} />
      </section>
    </main>
  );
}
