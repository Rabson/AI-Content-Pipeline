'use server';

import { revalidatePath } from 'next/cache';
import { backendMutation } from '../../lib/backend-client';
import { extractErrorMessage } from '../../lib/error-display';
import type { TopicFormState } from './topic-form-state';

export async function createTopicAction(_: TopicFormState, formData: FormData): Promise<TopicFormState> {
  const payload = {
    title: String(formData.get('title') ?? ''),
    brief: String(formData.get('brief') ?? ''),
    audience: String(formData.get('audience') ?? ''),
    tags: String(formData.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };

  try {
    await backendMutation('/v1/topics', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: extractErrorMessage(error) };
  }

  revalidatePath('/topics');
  return { error: null };
}
