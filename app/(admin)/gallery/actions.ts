'use server';
import { revalidatePath } from 'next/cache';
import { createGalleryImage, deleteGalleryImage } from '@/lib/api';

export async function addGalleryImage(_: unknown, formData: FormData) {
  const url = (formData.get('url') as string).trim();
  const alt = (formData.get('alt') as string).trim();
  const sortOrder = Number(formData.get('sortOrder') ?? 0);
  if (!url) return { error: 'URL is required.' };
  try {
    await createGalleryImage({ url, alt, sortOrder });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to add image.' };
  }
  revalidatePath('/gallery');
}

export async function removeGalleryImage(id: number) {
  await deleteGalleryImage(id);
  revalidatePath('/gallery');
}
