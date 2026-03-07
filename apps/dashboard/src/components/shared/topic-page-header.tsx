import type { ReactNode } from 'react';
import { TopicNav } from './topic-nav';

export function TopicPageHeader({
  eyebrow,
  title,
  topicId,
  lede,
  actions,
}: {
  eyebrow: string;
  title: string;
  topicId: string;
  lede?: string | null;
  actions?: ReactNode;
}) {
  return (
    <section className="detail-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {lede ? <p className="lede">{lede}</p> : null}
      <TopicNav topicId={topicId} />
      {actions ? <div className="detail-actions">{actions}</div> : null}
    </section>
  );
}
