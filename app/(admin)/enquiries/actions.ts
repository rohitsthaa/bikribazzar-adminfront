'use server';
import { markLeadRead } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function markLeadReadAction(id: number) {
  try {
    await markLeadRead(id);
    revalidatePath('/enquiries');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}
