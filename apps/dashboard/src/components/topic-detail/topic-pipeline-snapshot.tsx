import type { LinkedInDraftView, PublicationView, ResearchArtifactView } from '@aicp/contracts';
import { formatStatus, formatTopicPreview } from '../../lib/formatting';
import { getDraft } from '../../lib/api-client';

function SnapshotCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="stat-card">
      <p className="eyebrow">{label}</p>
      <h3>{title}</h3>
      <p className="topic-meta">{body}</p>
    </div>
  );
}

export function TopicPipelineSnapshot({
  research,
  draft,
  social,
  publications,
}: {
  research: ResearchArtifactView | null;
  draft: Awaited<ReturnType<typeof getDraft>>;
  social: LinkedInDraftView | null;
  publications: PublicationView[];
}) {
  return (
    <section className="grid-three">
      <SnapshotCard
        label="Research"
        title={research?.summary ? 'Ready' : 'Missing'}
        body={research?.summary ? formatTopicPreview(research.summary, 180) : 'No research artifact available.'}
      />
      <SnapshotCard
        label="Draft"
        title={draft ? formatStatus(draft.status) : 'Missing'}
        body={`${draft?.sections?.length ?? 0} sections stored across version ${draft?.versionNumber ?? 0}.`}
      />
      <SnapshotCard
        label="Distribution"
        title={`${publications.length} publications`}
        body={social ? 'LinkedIn draft available.' : 'No social draft yet.'}
      />
    </section>
  );
}
