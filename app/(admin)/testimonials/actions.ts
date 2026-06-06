'use server';
import { revalidatePath } from 'next/cache';
import { createTestimonial, updateTestimonial, deleteTestimonial } from '@/lib/api';

export async function addTestimonial(_: unknown, formData: FormData) {
  const quote = (formData.get('quote') as string).trim();
  const author = (formData.get('author') as string).trim();
  const sortOrder = Number(formData.get('sortOrder') ?? 0);
  if (!quote || !author) return { error: 'Quote and author are required.' };
  try {
    await createTestimonial({ quote, author, sortOrder });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to add testimonial.' };
  }
  revalidatePath('/testimonials');
}

export async function editTestimonial(id: number, _: unknown, formData: FormData) {
  const quote = (formData.get('quote') as string).trim();
  const author = (formData.get('author') as string).trim();
  const sortOrder = Number(formData.get('sortOrder') ?? 0);
  if (!quote || !author) return { error: 'Quote and author are required.' };
  try {
    await updateTestimonial(id, { quote, author, sortOrder });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to update testimonial.' };
  }
  revalidatePath('/testimonials');
}

export async function removeTestimonial(id: number) {
  await deleteTestimonial(id);
  revalidatePath('/testimonials');
}
