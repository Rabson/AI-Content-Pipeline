import Link from 'next/link';
import type { DraftVersionView } from '@aicp/contracts';

export function SectionListPanel({ topicId, draft }: { topicId: string; draft: DraftVersionView | null }) {
  return (
    <div className="panel">
      <h3>Sections</h3>
      <div className="list">
        {draft?.sections?.map((section) => (
          <Link key={section.sectionKey} href={`/topics/${topicId}/review?section=${section.sectionKey}`} className="list-item">
            <div>
              <strong>
                {section.position}. {section.heading}
              </strong>
              <p>{section.wordCount ?? 0} words</p>
            </div>
            <span className="pill">{section.sectionKey}</span>
          </Link>
        ))}
        {!draft?.sections?.length ? <p className="empty-state">Draft sections are not available yet.</p> : null}
      </div>
    </div>
  );
}
