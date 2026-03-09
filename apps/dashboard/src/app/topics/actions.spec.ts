import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTopicAction } from './actions';

const revalidatePath = vi.hoisted(() => vi.fn());
const backendMutation = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../lib/backend-client', () => ({ backendMutation }));

describe('createTopicAction', () => {
  beforeEach(() => {
    revalidatePath.mockReset();
    backendMutation.mockReset();
  });

  it('returns parsed backend validation errors for UI display', async () => {
    backendMutation.mockRejectedValue(
      new Error(
        JSON.stringify({
          error: { code: 'BAD_REQUEST', message: ['brief must be shorter than or equal to 3000 characters'] },
        }),
      ),
    );

    const formData = new FormData();
    formData.set('title', 'Topic');
    formData.set('brief', 'x');
    formData.set('audience', 'engineers');
    formData.set('tags', 'a,b');
    const result = await createTopicAction({ error: null }, formData);

    expect(result.error).toContain('brief must be shorter than or equal to 3000 characters');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('revalidates topics page on successful create', async () => {
    backendMutation.mockResolvedValue({ id: 'topic-1' });

    const formData = new FormData();
    formData.set('title', 'Topic');
    formData.set('brief', 'Brief');
    formData.set('audience', 'engineers');
    formData.set('tags', 'a,b');
    const result = await createTopicAction({ error: null }, formData);

    expect(result.error).toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/topics');
  });
});
