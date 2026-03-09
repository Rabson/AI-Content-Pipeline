'use server';

import { revalidatePath } from 'next/cache';
import { backendMutation } from '../../../lib/backend-client';
import { getDashboardUser } from '../../../lib/auth';

const OWNER_REASSIGN_ROLES = new Set(['ADMIN']);
const PUBLISH_ROLES = new Set(['ADMIN', 'USER']);

async function assertActionRole(action: string, allowedRoles: Set<string>) {
  const user = await getDashboardUser();
  if (!user.authorized || !allowedRoles.has(user.role)) {
    throw new Error(`${action} requires one of: ${Array.from(allowedRoles).join(', ')}`);
  }
}

function refreshTopicPaths(topicId: string) {
  revalidatePath('/topics');
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/draft`);
  revalidatePath(`/topics/${topicId}/review`);
  revalidatePath(`/topics/${topicId}/revisions`);
  revalidatePath(`/topics/${topicId}/publish`);
  revalidatePath(`/topics/${topicId}/history`);
  revalidatePath(`/topics/${topicId}/research`);
  revalidatePath(`/topics/${topicId}/outline`);
}

export async function createReviewSessionAction(topicId: string, draftVersionId: string) {
  await backendMutation(`/v1/drafts/${draftVersionId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  refreshTopicPaths(topicId);
}

export async function approveDraftAction(topicId: string, draftVersionId: string) {
  await backendMutation(`/v1/drafts/${draftVersionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  refreshTopicPaths(topicId);
}

export async function createReviewCommentAction(topicId: string, reviewSessionId: string, formData: FormData) {
  await backendMutation(`/v1/reviews/${reviewSessionId}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      sectionKey: String(formData.get('sectionKey') ?? ''),
      commentMd: String(formData.get('commentMd') ?? ''),
      severity: String(formData.get('severity') ?? 'MAJOR'),
    }),
  });
  refreshTopicPaths(topicId);
}

export async function updateReviewCommentAction(topicId: string, reviewSessionId: string, commentId: string, formData: FormData) {
  await backendMutation(`/v1/reviews/${reviewSessionId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: String(formData.get('status') ?? 'OPEN'),
      resolutionNote: String(formData.get('resolutionNote') ?? ''),
    }),
  });
  refreshTopicPaths(topicId);
}

export async function submitReviewAction(topicId: string, reviewSessionId: string) {
  await backendMutation(`/v1/reviews/${reviewSessionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  refreshTopicPaths(topicId);
}

export async function runRevisionAction(topicId: string, reviewSessionId: string, formData: FormData) {
  await backendMutation(`/v1/reviews/${reviewSessionId}/revisions/run`, {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          sectionKey: String(formData.get('sectionKey') ?? ''),
          instructionMd: String(formData.get('instructionMd') ?? ''),
          sourceCommentIds: formData.getAll('sourceCommentIds').map((value) => String(value)),
        },
      ],
    }),
  });
  refreshTopicPaths(topicId);
}

export async function generateSeoAction(topicId: string) {
  await backendMutation(`/v1/topics/${topicId}/seo/generate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  refreshTopicPaths(topicId);
}

export async function generateLinkedInAction(topicId: string) {
  await backendMutation(`/v1/topics/${topicId}/social/linkedin/generate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  refreshTopicPaths(topicId);
}

export async function requestPublicationAction(topicId: string, channel: string) {
  await assertActionRole('Publish request', PUBLISH_ROLES);
  await backendMutation(`/v1/topics/${topicId}/publications`, {
    method: 'POST',
    body: JSON.stringify({ channel, tags: ['ai', 'contentops'] }),
  });
  refreshTopicPaths(topicId);
}

export async function retryPublicationAction(topicId: string, publicationId: string) {
  await assertActionRole('Publication retry', PUBLISH_ROLES);
  await backendMutation(`/v1/topics/${topicId}/publications/${publicationId}/retry`, {
    method: 'POST',
  });
  refreshTopicPaths(topicId);
}

export async function assignTopicOwnerAction(topicId: string, formData: FormData) {
  await assertActionRole('Owner reassignment', OWNER_REASSIGN_ROLES);
  await backendMutation(`/v1/topics/${topicId}/owner`, {
    method: 'PATCH',
    body: JSON.stringify({
      ownerUserId: String(formData.get('ownerUserId') ?? ''),
    }),
  });
  refreshTopicPaths(topicId);
}

export async function setTopicBannerImageAction(topicId: string, formData: FormData) {
  await backendMutation(`/v1/topics/${topicId}/banner-image`, {
    method: 'PATCH',
    body: JSON.stringify({
      storageObjectId: String(formData.get('storageObjectId') ?? ''),
      alt: String(formData.get('alt') ?? ''),
      caption: String(formData.get('caption') ?? ''),
    }),
  });
  refreshTopicPaths(topicId);
}

export async function clearTopicBannerImageAction(topicId: string) {
  await backendMutation(`/v1/topics/${topicId}/banner-image`, {
    method: 'PATCH',
    body: JSON.stringify({
      storageObjectId: '',
      alt: '',
      caption: '',
    }),
  });
  refreshTopicPaths(topicId);
}

export async function uploadTopicBannerImageAction(topicId: string, formData: FormData) {
  const banner = formData.get('banner');
  if (!(banner instanceof File) || banner.size === 0) {
    throw new Error('Select a banner image file');
  }

  const alt = String(formData.get('alt') ?? '');
  const caption = String(formData.get('caption') ?? '');
  const presign = await backendMutation<{
    storageObjectId: string;
    uploadUrl: string;
  }>(`/v1/topics/${topicId}/assets/presign-upload`, {
    method: 'POST',
    body: JSON.stringify({
      filename: banner.name,
      mimeType: banner.type || 'application/octet-stream',
      sizeBytes: banner.size,
      purpose: 'IMAGE',
    }),
  });

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': banner.type || 'application/octet-stream',
    },
    body: Buffer.from(await banner.arrayBuffer()),
    cache: 'no-store',
  });

  if (!uploadResponse.ok) {
    throw new Error(`Banner upload failed: ${uploadResponse.status}`);
  }

  await backendMutation(`/v1/topics/${topicId}/banner-image`, {
    method: 'PATCH',
    body: JSON.stringify({
      storageObjectId: presign.storageObjectId,
      alt,
      caption,
    }),
  });

  refreshTopicPaths(topicId);
}

export async function updateSocialStatusAction(topicId: string, socialPostId: string, formData: FormData) {
  await backendMutation(`/v1/social-posts/${socialPostId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: String(formData.get('status') ?? 'DRAFT'),
      externalUrl: String(formData.get('externalUrl') ?? ''),
      note: String(formData.get('note') ?? ''),
    }),
  });
  refreshTopicPaths(topicId);
}
