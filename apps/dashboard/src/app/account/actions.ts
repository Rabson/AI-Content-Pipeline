'use server';

import { revalidatePath } from 'next/cache';
import { backendMutation } from '../../lib/backend-client';

function refresh() {
  revalidatePath('/account');
}

export async function upsertPublisherCredentialAction(channel: string, formData: FormData) {
  await backendMutation(`/v1/users/me/publisher-credentials/${channel}`, {
    method: 'PUT',
    body: JSON.stringify({
      token: String(formData.get('token') ?? ''),
      mediumAuthorId: String(formData.get('mediumAuthorId') ?? ''),
      mediumPublicationId: String(formData.get('mediumPublicationId') ?? ''),
      linkedinAuthorUrn: String(formData.get('linkedinAuthorUrn') ?? ''),
    }),
  });
  refresh();
}

export async function deletePublisherCredentialAction(channel: string) {
  await backendMutation(`/v1/users/me/publisher-credentials/${channel}`, {
    method: 'DELETE',
  });
  refresh();
}
