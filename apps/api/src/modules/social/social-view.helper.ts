import type { SocialRepository } from './social.repository';

export function toSocialView(post: Awaited<ReturnType<SocialRepository['latestLinkedInDraft']>>) {
  if (!post) {
    return null;
  }

  const version = post.versions[0];
  return {
    id: post.id,
    platform: post.platform,
    status: post.status,
    headline: version?.headline ?? '',
    post: version?.bodyText ?? '',
    hashtags: version?.hashtags ?? [],
    callToAction: version?.cta ?? '',
    latestVersionNumber: post.latestVersionNumber,
    approvedVersionNumber: post.approvedVersionNumber,
    postedVersionNumber: post.postedVersionNumber,
    externalUrl: post.externalUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}
