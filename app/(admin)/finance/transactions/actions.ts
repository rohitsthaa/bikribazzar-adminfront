'use server';
import { revalidatePath } from 'next/cache';
import {
  createLedgerEntry, updateLedgerEntry, deleteLedgerEntry,
  createFinanceCategory, updateFinanceCategory, deleteFinanceCategory,
} from '@/lib/api';

function revalidateFinance() {
  revalidatePath('/finance');
  revalidatePath('/finance/transactions');
}

export async function addEntry(_: unknown, formData: FormData) {
  const type = formData.get('type') as 'income' | 'expense';
  const categoryId = Number(formData.get('categoryId'));
  const amountNpr = Number(formData.get('amountNpr'));
  const description = (formData.get('description') as string)?.trim() || undefined;
  const occurredAtRaw = formData.get('occurredAt') as string;
  const occurredAt = occurredAtRaw ? new Date(occurredAtRaw).toISOString() : undefined;

  if (type !== 'income' && type !== 'expense') return { error: 'Pick income or expense.' };
  if (!categoryId) return { error: 'Pick a category.' };
  if (!amountNpr || amountNpr <= 0) return { error: 'Amount must be greater than zero.' };

  try {
    await createLedgerEntry({ type, categoryId, amountNpr, description, occurredAt });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to record transaction.' };
  }
  revalidateFinance();
  return { error: undefined };
}

export async function editEntry(id: number, data: {
  type: 'income' | 'expense'; categoryId: number; amountNpr: number; description?: string; occurredAt?: string;
}) {
  await updateLedgerEntry(id, data);
  revalidateFinance();
}

export async function removeEntry(id: number) {
  await deleteLedgerEntry(id);
  revalidateFinance();
}

export async function addCategory(_: unknown, formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const type = formData.get('type') as 'income' | 'expense';
  if (!name) return { error: 'Name is required.' };
  if (type !== 'income' && type !== 'expense') return { error: 'Pick income or expense.' };

  try {
    await createFinanceCategory({ name, type });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add category.';
    return { error: msg.includes('already exists') ? `Category "${name}" already exists.` : msg };
  }
  revalidateFinance();
  return { error: undefined };
}

export async function toggleCategory(id: number, active: boolean) {
  await updateFinanceCategory(id, { active });
  revalidateFinance();
}

export async function removeCategory(id: number) {
  await deleteFinanceCategory(id);
  revalidateFinance();
}
