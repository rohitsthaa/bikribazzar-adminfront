'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProduct, updateProduct } from '@/lib/api';

export async function saveProduct(_: unknown, formData: FormData) {
  const id = (formData.get('id') as string).trim().toLowerCase().replace(/\s+/g, '-');
  const isNew = formData.get('_isNew') === '1';

  const data = {
    id,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    priceNpr: Number(formData.get('priceNpr') ?? 0),
    category: formData.get('category') as 'shelf' | 'hanger' | 'wall' | 'custom',
    details: (formData.get('details') as string) || null,
    tag: (formData.get('tag') as string) || null,
    image: (formData.get('image') as string) || '',
    available: formData.get('available') === 'true',
    sortOrder: Number(formData.get('sortOrder') ?? 0),
  };

  try {
    if (isNew) {
      await createProduct(data);
    } else {
      await updateProduct(id, data);
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to save product.' };
  }

  revalidatePath('/products');
  redirect('/products');
}

export async function toggleAvailability(id: string, available: boolean) {
  await updateProduct(id, { available });
  revalidatePath('/products');
}
