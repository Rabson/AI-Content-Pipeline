import { getOutline, getTopic } from '../../../../lib/api-client';
import { TopicNav } from '../../../../components/shared/topic-nav';

export const dynamic = 'force-dynamic';

export default async function TopicOutlinePage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const [topic, outline] = await Promise.all([getTopic(topicId), getOutline(topicId)]);

  return (
    <main className="page stack">
      <section className="detail-header">
        <p className="eyebrow">Outline</p>
        <h2>{topic?.title ?? 'Topic'}</h2>
        <TopicNav topicId={topicId} />
      </section>
      <section className="panel">
        <h3>{outline?.title ?? 'No outline available'}</h3>
        <p className="lede">{outline?.objective ?? 'Generate an outline to unlock section-by-section drafting.'}</p>
        <div className="list">
          {outline?.sections?.map((section) => (
            <div className="list-item" key={section.sectionKey}>
              <div>
                <strong>
                  {section.position}. {section.heading}
                </strong>
                <p>{section.objective}</p>
              </div>
              <span className="pill">{section.targetWords} words</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
