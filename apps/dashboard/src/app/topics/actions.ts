'use server';

import { revalidatePath } from 'next/cache';
import { backendMutation } from '../../lib/backend-client';

export async function createTopicAction(formData: FormData) {
  const payload = {
    title: String(formData.get('title') ?? ''),
    brief: String(formData.get('brief') ?? ''),
    audience: String(formData.get('audience') ?? ''),
    tags: String(formData.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };

  await backendMutation('/v1/topics', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  revalidatePath('/topics');
}
