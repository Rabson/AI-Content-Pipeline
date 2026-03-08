'use server';

import { revalidatePath } from 'next/cache';
import { backendMutation } from '../../../lib/backend-client';

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
  await backendMutation(`/v1/topics/${topicId}/publications`, {
    method: 'POST',
    body: JSON.stringify({ channel, tags: ['ai', 'contentops'] }),
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
