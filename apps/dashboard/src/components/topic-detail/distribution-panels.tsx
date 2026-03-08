import type { LinkedInDraftView, SeoMetadataView } from '@aicp/contracts';
import { cleanText, formatStatus } from '../../lib/formatting';

function SeoSnapshotPanel({ seo }: { seo: SeoMetadataView | null }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>SEO snapshot</h3>
      </div>
      {seo ? (
        <div className="stack">
          <div>
            <strong>{seo.metaTitle}</strong>
            <p>{cleanText(seo.metaDescription)}</p>
          </div>
          <p className="topic-meta">Keywords: {seo.keywords?.join(', ')}</p>
        </div>
      ) : (
        <p className="empty-state">SEO metadata has not been generated yet.</p>
      )}
    </div>
  );
}

function LinkedInSnapshotPanel({ social }: { social: LinkedInDraftView | null }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>LinkedIn snapshot</h3>
      </div>
      {social ? (
        <div className="stack">
          <strong>{social.headline}</strong>
          <p>{cleanText(social.post)}</p>
          <p className="topic-meta">Status: {formatStatus(social.status)} · Hashtags: {social.hashtags?.join(' ')}</p>
        </div>
      ) : (
        <p className="empty-state">No LinkedIn draft generated yet.</p>
      )}
    </div>
  );
}

export function DistributionPanels({ seo, social }: { seo: SeoMetadataView | null; social: LinkedInDraftView | null }) {
  return (
    <section className="grid-two">
      <SeoSnapshotPanel seo={seo} />
      <LinkedInSnapshotPanel social={social} />
    </section>
  );
}
