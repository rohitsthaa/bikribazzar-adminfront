'use server';

import { revalidatePath } from 'next/cache';
import { createStoreAdmin, deleteAdminUser, patchAdminUser } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';

async function assertCanManageTeam() {
  const me = await getAdmin();
  if (!can(me?.role, 'settings')) throw new Error('Forbidden');
  return me!;
}

export async function createTeamMemberAction(
  email: string,
  password: string,
  role: 'store' | 'staff',
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertCanManageTeam();
    const storeId = await currentStoreId();
    await createStoreAdmin({ email: email.trim().toLowerCase(), password, storeId, role });
    revalidatePath('/settings/team');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create team member' };
  }
}

export async function deleteTeamMemberAction(
  memberId: number,
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertCanManageTeam();
    await deleteAdminUser(memberId);
    revalidatePath('/settings/team');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to remove team member' };
  }
}

export async function updateTeamMemberRoleAction(
  memberId: number,
  role: 'store' | 'staff',
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertCanManageTeam();
    await patchAdminUser(memberId, { role });
    revalidatePath('/settings/team');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update role' };
  }
}
