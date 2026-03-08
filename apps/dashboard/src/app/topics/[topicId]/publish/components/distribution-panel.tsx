import type { LinkedInDraftView, SeoMetadataView } from '@aicp/contracts';
import { updateSocialStatusAction } from '../../actions';

export function DistributionPanel({ topicId, seo, social }: { topicId: string; seo: SeoMetadataView | null; social: LinkedInDraftView | null }) {
  return (
    <div className="panel stack">
      <div className="stack stack-tight">
        <h3>SEO checklist</h3>
        {seo ? (
          <>
            <p className="topic-meta">Title: {seo.metaTitle}</p>
            <p className="topic-meta">Description: {seo.metaDescription}</p>
            <p className="topic-meta">Slug: {seo.slug}</p>
            <p className="topic-meta">Tags: {seo.tags.join(', ')}</p>
          </>
        ) : (
          <p className="empty-state">SEO artifact missing.</p>
        )}
      </div>
      <div className="stack stack-tight">
        <h4>LinkedIn draft</h4>
        <p>{social?.post ?? 'No social draft available.'}</p>
        {social ? (
          <div className="detail-actions">
            <form action={updateSocialStatusAction.bind(null, topicId, social.id)}>
              <input type="hidden" name="status" value="APPROVED" />
              <button className="button button-secondary" type="submit">Approve LinkedIn draft</button>
            </form>
            <form action={updateSocialStatusAction.bind(null, topicId, social.id)} className="create-form">
              <input type="hidden" name="status" value="POSTED" />
              <input name="externalUrl" placeholder="Posted URL" defaultValue={social.externalUrl ?? ''} />
              <button className="button" type="submit">Mark as posted</button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
