'use client';

import { useState, useTransition } from 'react';
import type { AdminUserView } from '@/lib/api';
import { createStoreAdminAction, deleteStoreAdminAction } from '../actions';

export default function StoreAdmins({
  storeId,
  storeName,
  admins,
}: {
  storeId: string;
  storeName: string;
  admins: AdminUserView[];
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'store' | 'staff'>('store');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  function handleCreate() {
    setError('');
    if (!email.trim() || password.length < 8) {
      setError('Email and a password of at least 8 characters are required.');
      return;
    }
    start(async () => {
      const res = await createStoreAdminAction(storeId, email, password, role);
      if (res && 'error' in res) setError(res.error);
      else { setEmail(''); setPassword(''); setRole('store'); }
    });
  }

  const roleLabel = (r: string) => (r === 'staff' ? 'Staff' : 'Store admin');

  function handleDelete(id: number) {
    setError('');
    start(async () => {
      const res = await deleteStoreAdminAction(storeId, id);
      if (res && 'error' in res) setError(res.error);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-stone-900">Store admins</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          Logins that can only manage <span className="font-medium">{storeName}</span>. <strong>Store admin</strong> can do everything for the shop incl. settings &amp; payments; <strong>Staff</strong> handles orders, inventory, products &amp; content but not store settings.
        </p>
      </div>

      {admins.length > 0 ? (
        <ul className="divide-y divide-stone-100 border border-stone-100 rounded-xl">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-stone-800">
                {a.email}
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{roleLabel(a.role)}</span>
              </span>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                disabled={pending}
                className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-400">No store admins yet.</p>
      )}

      <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-start pt-1">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@store.com"
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 chars)"
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'store' | 'staff')}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
        >
          <option value="store">Store admin</option>
          <option value="staff">Staff</option>
        </select>
        <button
          type="button"
          onClick={handleCreate}
          disabled={pending}
          className="rounded-lg bg-stone-800 text-white px-4 py-2 text-sm font-medium hover:bg-stone-700 disabled:opacity-50 whitespace-nowrap"
        >
          {pending ? 'Saving…' : 'Add admin'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
