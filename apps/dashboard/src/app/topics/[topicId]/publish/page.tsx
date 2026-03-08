import type { LinkedInDraftView, PublicationOptionsView, PublicationView, SeoMetadataView, StorageObjectView, TopicDetail, UserSummary } from '@aicp/shared-types';
import {
  getLinkedInDraft,
  getPublicationOptions,
  getPublications,
  getSeo,
  getTopic,
  getTopicAssets,
} from '../../../../lib/api-client';
import { getUsers } from '../../../../lib/api-client/user-api';
import { getDashboardUser } from '../../../../lib/auth';
import { isPhaseEnabled } from '../../../../lib/feature-flags';
import { TopicPageHeader } from '../../../../components/shared/topic-page-header';
import { PublishActions } from './publish-actions';
import {
  BannerPanel,
  DistributionPanel,
  OwnerAssignmentPanel,
  PublicationHistoryPanel,
  PublishReadinessPanel,
} from './publish-panels';

export const dynamic = 'force-dynamic';

type PublishPageData = {
  topic: TopicDetail | null;
  seo: SeoMetadataView | null;
  social: LinkedInDraftView | null;
  publications: PublicationView[];
  publicationOptions: PublicationOptionsView | null;
  assets: StorageObjectView[];
  users: UserSummary[];
};

async function loadPublishPageData(topicId: string, isAdmin: boolean): Promise<PublishPageData> {
  const [topic, seo, social, publications, publicationOptions, assets, users] = await Promise.all([
    getTopic(topicId),
    getSeo(topicId),
    getLinkedInDraft(topicId),
    getPublications(topicId),
    getPublicationOptions(topicId),
    getTopicAssets(topicId),
    isAdmin ? getUsers() : Promise.resolve([]),
  ]);

  return { topic, seo, social, publications, publicationOptions, assets, users };
}

export default async function TopicPublishPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const phase2Enabled = isPhaseEnabled(2);
  const user = await getDashboardUser();

  if (!phase2Enabled) {
    return (
      <main className="page stack">
        <TopicPageHeader eyebrow="Publish" title="Topic" topicId={topicId} />
        <section className="panel">
          <p className="empty-state">Phase 2 distribution features are disabled in this environment.</p>
        </section>
      </main>
    );
  }

  const { topic, seo, social, publications, publicationOptions, assets, users } = await loadPublishPageData(
    topicId,
    user.role === 'ADMIN',
  );

  return (
    <main className="page stack">
      <TopicPageHeader
        eyebrow="Publish"
        title={topic?.title ?? 'Topic'}
        topicId={topicId}
        actions={<PublishActions topicId={topicId} role={user.role} />}
      />
      <section className="grid-two">
        <DistributionPanel topicId={topicId} seo={seo} social={social} />
        <PublishReadinessPanel topicId={topicId} options={publicationOptions} />
      </section>
      <section className="grid-two">
        <BannerPanel topicId={topicId} topic={topic} assets={assets} />
        <PublicationHistoryPanel topicId={topicId} publications={publications} />
      </section>
      {publicationOptions?.canReassignOwner ? (
        <OwnerAssignmentPanel topicId={topicId} owner={publicationOptions.owner} users={users} />
      ) : null}
    </main>
  );
}
