import Link from 'next/link';
import { getDashboardUser } from '../../lib/auth';
import { isPhaseEnabled } from '../../lib/feature-flags';

export async function TopicNav({ topicId }: { topicId: string }) {
  const phase2Enabled = isPhaseEnabled(2);
  const user = await getDashboardUser();
  const isPublisherUser = user.role === 'USER';

  return (
    <nav className="topic-nav">
      <Link href={`/topics/${topicId}`}>Overview</Link>
      <Link href={`/topics/${topicId}/research`}>Research</Link>
      <Link href={`/topics/${topicId}/outline`}>Outline</Link>
      <Link href={`/topics/${topicId}/draft`}>Draft</Link>
      {!isPublisherUser ? <Link href={`/topics/${topicId}/review`}>Review</Link> : null}
      {!isPublisherUser ? <Link href={`/topics/${topicId}/revisions`}>Revisions</Link> : null}
      {phase2Enabled ? <Link href={`/topics/${topicId}/publish`}>Publish</Link> : null}
      {!isPublisherUser ? <Link href={`/topics/${topicId}/history`}>History</Link> : null}
    </nav>
  );
}
