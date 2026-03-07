import type { LinkedInDraftView, PublicationView, SeoMetadataView, TopicDetail } from '@aicp/shared-types';
import { getLinkedInDraft, getPublications, getSeo, getTopic } from '../../../../lib/api-client';
import { isPhaseEnabled } from '../../../../lib/feature-flags';
import { formatDate } from '../../../../lib/formatting';
import { TopicPageHeader } from '../../../../components/shared/topic-page-header';
import { PublishActions } from './publish-actions';
import { updateSocialStatusAction } from '../actions';

export const dynamic = 'force-dynamic';

type PublishPageData = {
  topic: TopicDetail | null;
  seo: SeoMetadataView | null;
  social: LinkedInDraftView | null;
  publications: PublicationView[];
};

async function loadPublishPageData(topicId: string, phase2Enabled: boolean): Promise<PublishPageData> {
  const [topic, seo, social, publications] = phase2Enabled
    ? await Promise.all([getTopic(topicId), getSeo(topicId), getLinkedInDraft(topicId), getPublications(topicId)])
    : await Promise.all([getTopic(topicId), Promise.resolve(null), Promise.resolve(null), Promise.resolve([])]);

  return { topic, seo, social, publications };
}

function DisabledPhaseState() {
  return (
    <section className="panel">
      <p className="empty-state">Phase 2 distribution features are disabled in this environment.</p>
    </section>
  );
}

function SeoChecklistPanel({ seo }: { seo: SeoMetadataView | null }) {
  return (
    <div className="stack">
      <h3>SEO checklist</h3>
      {seo ? (
        <div className="stack">
          <p className="topic-meta">Title: {seo.metaTitle}</p>
          <p className="topic-meta">Description: {seo.metaDescription}</p>
          <p className="topic-meta">Slug: {seo.slug}</p>
          <p className="topic-meta">Tags: {seo.tags.join(', ')}</p>
        </div>
      ) : (
        <p className="empty-state">SEO artifact missing.</p>
      )}
    </div>
  );
}

function LinkedInDraftPanel({ topicId, social }: { topicId: string; social: LinkedInDraftView | null }) {
  return (
    <div className="stack">
      <h4>LinkedIn draft</h4>
      <p>{social?.post ?? 'No social draft available.'}</p>
      {social ? (
        <div className="detail-actions">
          <form action={updateSocialStatusAction.bind(null, topicId, social.id)}>
            <input type="hidden" name="status" value="APPROVED" />
            <button className="button button-secondary" type="submit">
              Approve LinkedIn draft
            </button>
          </form>
          <form action={updateSocialStatusAction.bind(null, topicId, social.id)} className="create-form">
            <input type="hidden" name="status" value="POSTED" />
            <input name="externalUrl" placeholder="Posted URL" defaultValue={social.externalUrl ?? ''} />
            <button className="button" type="submit">
              Mark as posted
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function DistributionPanel({ topicId, seo, social }: { topicId: string; seo: SeoMetadataView | null; social: LinkedInDraftView | null }) {
  return (
    <div className="panel stack">
      <SeoChecklistPanel seo={seo} />
      <LinkedInDraftPanel topicId={topicId} social={social} />
    </div>
  );
}

function PublicationHistoryPanel({ publications }: { publications: PublicationView[] }) {
  return (
    <div className="panel">
      <h3>Dev.to publish history</h3>
      <div className="list">
        {publications.map((publication) => (
          <div className="list-item" key={publication.id}>
            <div>
              <strong>{publication.title}</strong>
              <p>{publication.externalUrl ?? publication.error ?? 'Pending external URL.'}</p>
              <p className="topic-meta">Created {formatDate(publication.createdAt)}</p>
              <p className="topic-meta">Verification: {publication.verificationStatus ?? 'pending'}</p>
            </div>
            <span className="pill">{publication.status}</span>
          </div>
        ))}
        {!publications.length ? <p className="empty-state">No publication attempts yet.</p> : null}
      </div>
    </div>
  );
}

export default async function TopicPublishPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const phase2Enabled = isPhaseEnabled(2);
  const { topic, seo, social, publications } = await loadPublishPageData(topicId, phase2Enabled);

  return (
    <main className="page stack">
      <TopicPageHeader
        eyebrow="Publish"
        title={topic?.title ?? 'Topic'}
        topicId={topicId}
        actions={phase2Enabled ? <PublishActions topicId={topicId} /> : undefined}
      />
      {!phase2Enabled ? (
        <DisabledPhaseState />
      ) : (
        <section className="grid-two">
          <DistributionPanel topicId={topicId} seo={seo} social={social} />
          <PublicationHistoryPanel publications={publications} />
        </section>
      )}
    </main>
  );
}
