'use server';

import { revalidatePath } from 'next/cache';
import { createStoreAdmin, deleteAdminUser, patchAdminUser, resetAdminUserPassword } from '@/lib/api';
import { getAdmin, can } from '@/lib/auth';
import { currentStoreId } from '@/lib/store-context';
import { friendlyApiError } from '@/lib/errors';

async function assertCanManageTeam() {
  const me = await getAdmin();
  if (!can(me?.role, 'settings')) throw new Error('Forbidden');
  return me!;
}

export async function createTeamMemberAction(
  email: string,
  password: string,
  role: 'store' | 'staff',
  /** Tab keys (lib/tabs.ts) to restrict this account to. Omit/undefined = unrestricted. Only meaningful for 'staff'. */
  allowedTabs?: string[],
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertCanManageTeam();
    const storeId = await currentStoreId();
    await createStoreAdmin({ email: email.trim().toLowerCase(), password, storeId, role, allowedTabs });
    revalidatePath('/settings/team');
    return { ok: true };
  } catch (e) {
    return { error: friendlyApiError(e, 'Failed to create team member.') };
  }
}

export async function updateTeamMemberTabsAction(
  memberId: number,
  /** null = clear the restriction (unrestricted). */
  allowedTabs: string[] | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertCanManageTeam();
    await patchAdminUser(memberId, { allowedTabs });
    revalidatePath('/settings/team');
    return { ok: true };
  } catch (e) {
    return { error: friendlyApiError(e, 'Failed to update tab access.') };
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
    return { error: friendlyApiError(e, 'Failed to remove team member.') };
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
    return { error: friendlyApiError(e, 'Failed to update role.') };
  }
}

export async function resetTeamMemberPasswordAction(
  memberId: number,
  newPassword: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertCanManageTeam();
    if (newPassword.length < 8) return { error: 'Password must be at least 8 characters.' };
    await resetAdminUserPassword(memberId, newPassword);
    return { ok: true };
  } catch (e) {
    return { error: friendlyApiError(e, 'Failed to reset password.') };
  }
}
