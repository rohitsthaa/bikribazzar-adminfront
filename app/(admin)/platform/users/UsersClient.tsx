'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { AdminUserView, StoreSummary } from '@/lib/api';
import { patchAdminUserAction, deleteAdminUserAction, createPlatformAdminAction } from './actions';

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  super: 'bg-indigo-100 text-indigo-700',
  store: 'bg-amber-100 text-amber-700',
  staff: 'bg-stone-100 text-stone-600',
};

const ROLE_LABELS: Record<string, string> = {
  super: 'Super',
  store: 'Store admin',
  staff: 'Staff',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[role] ?? 'bg-stone-100 text-stone-500'}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ email, role }: { email: string; role: string }) {
  const initial = email[0]?.toUpperCase() ?? '?';
  const bg = role === 'super' ? 'bg-indigo-500' : role === 'store' ? 'bg-amber-500' : 'bg-stone-400';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold flex-shrink-0 ${bg}`}>
      {initial}
    </span>
  );
}

// ── Confirm-delete button ──────────────────────────────────────────────────────

function DeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled: boolean }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg disabled:opacity-50 transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1"
        >
          Cancel
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setConfirm(true)}
      disabled={disabled}
      className="text-xs text-stone-400 hover:text-red-600 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-red-50"
    >
      Remove
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UsersClient({
  users,
  stores,
}: {
  users: AdminUserView[];
  stores: StoreSummary[];
}) {
  const [storeFilter, setStoreFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  // Add-user form state
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'store' | 'staff'>('store');
  const [newStoreId, setNewStoreId] = useState(stores[0]?.id ?? '');

  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));

  const filtered = users.filter((u) => {
    if (storeFilter !== 'all' && u.storeId !== storeFilter) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  function handleRoleChange(userId: number, role: string) {
    setError('');
    start(async () => {
      const res = await patchAdminUserAction(userId, role);
      if ('error' in res) setError(res.error);
    });
  }

  function handleDelete(userId: number) {
    setError('');
    start(async () => {
      const res = await deleteAdminUserAction(userId);
      if ('error' in res) setError(res.error);
    });
  }

  function handleCreate() {
    setError('');
    if (!newEmail.trim() || newPassword.length < 8 || !newStoreId) {
      setError('Email, password (≥ 8 chars), and store are required.');
      return;
    }
    start(async () => {
      const res = await createPlatformAdminAction(newEmail, newPassword, newRole, newStoreId);
      if ('error' in res) {
        setError(res.error);
      } else {
        setNewEmail('');
        setNewPassword('');
        setNewRole('store');
        setNewStoreId(stores[0]?.id ?? '');
        setShowAdd(false);
      }
    });
  }

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4">

      {/* Filters + Add button */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">All stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
          <option value="">Platform (super)</option>
        </select>

        <div className="flex rounded-xl border border-stone-200 bg-white overflow-hidden text-sm">
          {(['all', 'super', 'store', 'staff'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 transition-colors ${roleFilter === r ? 'bg-indigo-600 text-white font-medium' : 'text-stone-500 hover:text-stone-900'}`}
            >
              {r === 'all' ? 'All roles' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAdd((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add user
        </button>
      </div>

      {/* Add-user panel */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-5">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">New admin user</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email address"
              className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <select
              value={newStoreId}
              onChange={(e) => setNewStoreId(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'store' | 'staff')}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="store">Store admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={pending}
              className="rounded-xl bg-indigo-600 text-white px-5 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Creating…' : 'Create user'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm text-stone-400 hover:text-stone-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* User table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-stone-400">
            No users match these filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">User</th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Store</th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Verified</th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar email={u.email} role={u.role} />
                      <span className="text-stone-800 font-medium truncate max-w-[180px]">{u.email}</span>
                    </div>
                  </td>

                  {/* Store */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {u.storeId ? (
                      <Link
                        href={`/platform/${u.storeId}`}
                        className="text-stone-500 hover:text-indigo-600 transition-colors"
                      >
                        {storeMap[u.storeId] ?? u.storeId}
                      </Link>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>

                  {/* Role (editable) */}
                  <td className="px-4 py-3">
                    {u.role === 'super' ? (
                      <RoleBadge role="super" />
                    ) : (
                      <select
                        defaultValue={u.role}
                        disabled={pending}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-[11px] font-medium rounded-full border-0 bg-amber-100 text-amber-700 px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="store">Store admin</option>
                        <option value="staff">Staff</option>
                      </select>
                    )}
                  </td>

                  {/* Email verified */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-stone-400 hidden lg:table-cell">
                    {fmtDate(u.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <DeleteButton
                      onConfirm={() => handleDelete(u.id)}
                      disabled={pending}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-stone-400">
        {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        {filtered.length !== users.length ? ' (filtered)' : ''}
      </p>
    </div>
  );
}
