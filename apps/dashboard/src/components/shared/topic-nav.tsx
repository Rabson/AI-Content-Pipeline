import Link from 'next/link';
import { isPhaseEnabled } from '../../lib/feature-flags';

export function TopicNav({ topicId }: { topicId: string }) {
  const phase2Enabled = isPhaseEnabled(2);

  return (
    <nav className="topic-nav">
      <Link href={`/topics/${topicId}`}>Overview</Link>
      <Link href={`/topics/${topicId}/research`}>Research</Link>
      <Link href={`/topics/${topicId}/outline`}>Outline</Link>
      <Link href={`/topics/${topicId}/draft`}>Draft</Link>
      <Link href={`/topics/${topicId}/review`}>Review</Link>
      <Link href={`/topics/${topicId}/revisions`}>Revisions</Link>
      {phase2Enabled ? <Link href={`/topics/${topicId}/publish`}>Publish</Link> : null}
      <Link href={`/topics/${topicId}/history`}>History</Link>
    </nav>
  );
}
