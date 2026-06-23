'use server';
import { createBlogPost, updateBlogPost, deleteBlogPost } from '@/lib/api';
import { getAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { BlogPost } from '@/lib/api';

async function assertCanEdit() {
  const me = await getAdmin();
  if (!me) throw new Error('Not authenticated');
}

export async function createPostAction(data: Partial<BlogPost>): Promise<{ post?: BlogPost; error?: string }> {
  try {
    await assertCanEdit();
    const post = await createBlogPost(data);
    revalidatePath('/blog');
    return { post };
  } catch (e) { return { error: String(e) }; }
}

export async function updatePostAction(id: number, data: Partial<BlogPost>): Promise<{ post?: BlogPost; error?: string }> {
  try {
    await assertCanEdit();
    const post = await updateBlogPost(id, data);
    revalidatePath('/blog');
    return { post };
  } catch (e) { return { error: String(e) }; }
}

export async function deletePostAction(id: number): Promise<{ error?: string }> {
  try {
    await assertCanEdit();
    await deleteBlogPost(id);
    revalidatePath('/blog');
    return {};
  } catch (e) { return { error: String(e) }; }
}
