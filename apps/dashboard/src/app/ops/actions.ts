'use server';

import { revalidatePath } from 'next/cache';
import { backendMutation } from '../../lib/backend-client';

export async function retryFailedPublicationFromOpsAction(publicationId: string) {
  await backendMutation(`/v1/ops/publication-failures/${publicationId}/retry`, {
    method: 'POST',
  });
  revalidatePath('/ops');
}
