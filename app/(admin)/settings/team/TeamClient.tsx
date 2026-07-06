'use client';

import { useState, useTransition } from 'react';
import type { AdminUserView } from '@/lib/api';
import { STAFF_TOGGLE_TABS, parseAllowedTabs } from '@/lib/tabs';
import {
  createTeamMemberAction,
  deleteTeamMemberAction,
  resetTeamMemberPasswordAction,
  updateTeamMemberRoleAction,
  updateTeamMemberTabsAction,
} from './actions';

const ALL_TAB_KEYS = STAFF_TOGGLE_TABS.map((t) => t.key);

const ROLE_LABELS: Record<string, string> = {
  store: 'Store admin',
  staff: 'Staff',
  super: 'Super admin',
};

function Avatar({ email, role }: { email: string; role: string }) {
  const initial = email[0]?.toUpperCase() ?? '?';
  const bg = role === 'store' ? 'bg-amber-500' : 'bg-stone-400';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold flex-shrink-0 ${bg}`}>
      {initial}
    </span>
  );
}

// ── Confirm-delete button ────────────────────────────────────────────────────
// Same two-step pattern as the Platform console's Users page (UsersClient.tsx)
// — a bare "Remove" that turns into Confirm/Cancel, rather than deleting
// immediately on first click.

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
      className="text-xs text-stone-400 hover:text-red-600 transition-colors disabled:opacity-50 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-red-50"
    >
      Remove
    </button>
  );
}

// ── Reset-password control ───────────────────────────────────────────────────
// Bare "Reset password" link expands into an inline password field + Save/Cancel.

function ResetPasswordControl({
  onSave,
  disabled,
}: {
  onSave: (newPassword: string) => Promise<string | void>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [localError, setLocalError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="text-xs text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-50 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-stone-100"
      >
        Reset password
      </button>
    );
  }

  async function handleSave() {
    if (value.length < 8) {
      setLocalError('At least 8 characters.');
      return;
    }
    setLocalError('');
    setSaving(true);
    const err = await onSave(value);
    setSaving(false);
    if (err) {
      setLocalError(err);
    } else {
      setOpen(false);
      setValue('');
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="New password"
          className="w-32 rounded-lg border border-stone-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
        />
        <button
          onClick={handleSave}
          disabled={saving || disabled}
          className="text-xs font-medium text-white bg-stone-900 hover:bg-stone-700 px-2 py-1 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => { setOpen(false); setValue(''); setLocalError(''); }}
          className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1"
        >
          Cancel
        </button>
      </div>
      {localError && <p className="text-[11px] text-red-600">{localError}</p>}
    </div>
  );
}

// ── Tab access checkbox grid ─────────────────────────────────────────────────
// Shared by the "Add team member" form and the per-member edit control below.
// Selection is tracked as "which tabs are checked" — all-checked means
// unrestricted (sent as undefined/null, not an explicit full list), so a newly
// added tab in lib/tabs.ts is visible by default rather than silently hidden
// for staff accounts created before it existed.

function TabCheckboxGrid({
  selected,
  onChange,
  disabled,
}: {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
}) {
  const allSelected = selected.size === ALL_TAB_KEYS.length;

  function toggleAll() {
    onChange(allSelected ? new Set() : new Set(ALL_TAB_KEYS));
  }

  function toggleOne(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium text-stone-600">
        <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={disabled} />
        All tabs
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 pl-0.5">
        {STAFF_TOGGLE_TABS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={selected.has(key)}
              onChange={() => toggleOne(key)}
              disabled={disabled}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Per-member tab-access edit control ───────────────────────────────────────

function TabAccessControl({
  currentAllowedTabs,
  onSave,
  disabled,
}: {
  currentAllowedTabs: string | null;
  onSave: (tabs: string[] | null) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(parseAllowedTabs(currentAllowedTabs) ?? ALL_TAB_KEYS),
  );

  if (!open) {
    const parsed = parseAllowedTabs(currentAllowedTabs);
    const summary = parsed ? `${parsed.length} of ${ALL_TAB_KEYS.length} tabs` : 'All tabs';
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="text-xs text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-stone-100 text-left"
      >
        {summary}
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-3">
      <TabCheckboxGrid selected={selected} onChange={setSelected} disabled={disabled} />
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            onSave(selected.size === ALL_TAB_KEYS.length ? null : Array.from(selected));
            setOpen(false);
          }}
          disabled={disabled}
          className="text-xs font-medium text-white bg-stone-900 hover:bg-stone-700 px-3 py-1 rounded-lg disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function TeamClient({
  members,
  meId,
}: {
  members: AdminUserView[];
  meId: number | null;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'store' | 'staff'>('staff');
  const [newMemberTabs, setNewMemberTabs] = useState<Set<string>>(new Set(ALL_TAB_KEYS));
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  function handleCreate() {
    setError('');
    if (!email.trim() || password.length < 8) {
      setError('Email and a password of at least 8 characters are required.');
      return;
    }
    start(async () => {
      // All tabs selected == unrestricted, so send undefined rather than the full explicit
      // list (keeps new tabs added later visible by default for this account).
      const allowedTabs = role === 'staff' && newMemberTabs.size < ALL_TAB_KEYS.length
        ? Array.from(newMemberTabs)
        : undefined;
      const res = await createTeamMemberAction(email, password, role, allowedTabs);
      if ('error' in res) setError(res.error);
      else { setEmail(''); setPassword(''); setRole('staff'); setNewMemberTabs(new Set(ALL_TAB_KEYS)); }
    });
  }

  function handleUpdateTabs(id: number, tabs: string[] | null) {
    setError('');
    start(async () => {
      const res = await updateTeamMemberTabsAction(id, tabs);
      if ('error' in res) setError(res.error);
    });
  }

  function handleDelete(id: number) {
    setError('');
    start(async () => {
      const res = await deleteTeamMemberAction(id);
      if ('error' in res) setError(res.error);
    });
  }

  function handleRoleChange(id: number, newRole: 'store' | 'staff') {
    setError('');
    start(async () => {
      const res = await updateTeamMemberRoleAction(id, newRole);
      if ('error' in res) setError(res.error);
    });
  }

  async function handleResetPassword(id: number, newPassword: string): Promise<string | void> {
    const res = await resetTeamMemberPasswordAction(id, newPassword);
    if ('error' in res) return res.error;
  }

  const selfAndOthers = members.filter((m) => m.id === meId);
  const nonSelf = members.filter((m) => m.id !== meId);
  const displayOrder = [...selfAndOthers, ...nonSelf];

  return (
    <div className="space-y-6">

      {/* Info banner */}
      <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        <strong>Store admin</strong> — full access including settings and pricing.{' '}
        <strong>Staff</strong> — can handle orders, inventory, and products but not store settings,
        and can be limited to only the tabs they need.
        <br />
        New accounts receive a verification email before they can log in.
      </div>

      {/* Member list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {displayOrder.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-stone-400">
            No team members yet. Add someone below.
          </div>
        ) : (
          <ul className="divide-y divide-stone-50">
            {displayOrder.map((m) => {
              const isMe = m.id === meId;
              return (
                <li key={m.id} className="flex flex-col gap-2 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar email={m.email} role={m.role} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-stone-800 truncate">{m.email}</span>
                        {isMe && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            You
                          </span>
                        )}
                      </div>

                      {/* Email verification warning */}
                      {!m.emailVerified && (
                        <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          Awaiting email verification
                        </p>
                      )}
                    </div>

                    {/* Role control */}
                    {m.role === 'super' ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex-shrink-0">
                        Super admin
                      </span>
                    ) : isMe ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                        {ROLE_LABELS[m.role]}
                      </span>
                    ) : (
                      <select
                        defaultValue={m.role}
                        disabled={pending}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as 'store' | 'staff')}
                        className="text-[11px] font-medium rounded-full border border-stone-200 bg-white text-stone-700 px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 disabled:opacity-50 cursor-pointer flex-shrink-0"
                      >
                        <option value="store">Store admin</option>
                        <option value="staff">Staff</option>
                      </select>
                    )}

                    {/* Reset password + Remove (not self, not super) */}
                    {!isMe && m.role !== 'super' && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <ResetPasswordControl
                          onSave={(pw) => handleResetPassword(m.id, pw)}
                          disabled={pending}
                        />
                        <DeleteButton onConfirm={() => handleDelete(m.id)} disabled={pending} />
                      </div>
                    )}
                  </div>

                  {/* Tab access (staff only — store admins/super always see everything) */}
                  {m.role === 'staff' && (
                    <div className="flex items-center gap-2 pl-11">
                      <span className="text-[11px] text-stone-400 flex-shrink-0">Tabs:</span>
                      <TabAccessControl
                        currentAllowedTabs={m.allowedTabs}
                        onSave={(tabs) => handleUpdateTabs(m.id, tabs)}
                        disabled={pending}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add member form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">Add team member</h2>

        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30 focus:border-[#c96a3a]/60"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'store' | 'staff')}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
          >
            <option value="staff">Staff</option>
            <option value="store">Store admin</option>
          </select>
        </div>

        {role === 'staff' && (
          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-xs font-medium text-stone-600 mb-2">Tabs this staff member can access</p>
            <TabCheckboxGrid selected={newMemberTabs} onChange={setNewMemberTabs} disabled={pending} />
          </div>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={pending}
          className="rounded-xl bg-stone-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Sending invite…' : 'Send invite'}
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
