'use server';
import { updateReviewStatus } from '@/lib/api';

export async function updateReviewStatusAction(
  id: number,
  status: 'approved' | 'rejected' | 'pending',
) {
  return updateReviewStatus(id, status);
}
