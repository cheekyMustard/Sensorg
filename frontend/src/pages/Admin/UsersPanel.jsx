import { useState, useEffect } from 'react';
import { UserPlus, ChevronDown, Trash2 } from 'lucide-react';
import { useAdminUsers, useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser } from '../../hooks/useAdmin.js';
import { useAdminShops } from '../../hooks/useAdmin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';

const ROLES = ['admin', 'driver', 'mechanic', 'cleaner', 'organiser', 'general'];

function RolesSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROLES.map(r => {
        const on = value.includes(r);
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(on ? value.filter(x => x !== r) : [...value, r])}
            className="rounded-full px-2.5 py-1 text-xs font-medium border transition-colors"
            style={on
              ? { background: '#2563EB', color: '#fff', borderColor: '#2563EB' }
              : { background: '#F9FAFB', color: '#6B7280', borderColor: '#D1D5DB' }
            }
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

function UserRow({ user, shops }) {
  const { user: me } = useAuth();
  const [open, setOpen]           = useState(false);
  const [confirm, setConfirm]     = useState(false);
  const [form, setForm]           = useState({ roles: user.roles ?? [], shop_id: user.shop_id ?? '', is_active: user.is_active, password: '' });
  const updateMutation            = useUpdateAdminUser();
  const deleteMutation            = useDeleteAdminUser();

  useEffect(() => {
    setForm(f => ({ ...f, roles: user.roles ?? [], shop_id: user.shop_id ?? '', is_active: user.is_active }));
  }, [user.roles, user.shop_id, user.is_active]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    const data = { roles: form.roles, shop_id: form.shop_id || null, is_active: form.is_active };
    if (form.password) data.password = form.password;
    await updateMutation.mutateAsync({ id: user.id, data });
    setOpen(false);
  }

  const isSelf = me?.id === user.id;

  return (
    <>
      <li className="rounded-xl border border-gray-200 bg-white">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-800">{user.username}</span>
            {(user.roles ?? []).map(r => (
              <span key={r} className={`rounded-full px-2 py-0.5 text-xs ${user.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {r}
              </span>
            ))}
            {!user.is_active && <span className="text-xs text-red-400">inactive</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
            <span>{user.shop_name ?? '—'}</span>
            <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </div>
        </button>

        {open && (
          <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Roles</label>
              <RolesSelector value={form.roles} onChange={v => set('roles', v)} />
              {form.roles.length === 0 && (
                <p className="text-xs text-red-500">At least one role is required</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Shop</label>
              <select value={form.shop_id} onChange={e => set('shop_id', e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">— none —</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">New password <span className="text-gray-400">(leave blank to keep)</span></label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
                  className="rounded" />
                Active
              </label>
              <div className="flex gap-2">
                {!isSelf && (
                  <button
                    type="button"
                    onClick={() => setConfirm(true)}
                    className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={save} disabled={updateMutation.isPending || form.roles.length === 0}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </li>

      <ConfirmDialog
        open={confirm}
        title={`Delete ${user.username}?`}
        message="This permanently deletes the user and cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={async () => { await deleteMutation.mutateAsync(user.id); setConfirm(false); setOpen(false); }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}

export default function UsersPanel() {
  const { data: users = [], isLoading } = useAdminUsers();
  const { data: shops = [] }            = useAdminShops();
  const createMutation                  = useCreateAdminUser();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ username: '', password: '', roles: ['general'], shop_id: '' });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleCreate(e) {
    e.preventDefault();
    await createMutation.mutateAsync({ ...form, shop_id: form.shop_id || null });
    setForm({ username: '', password: '', roles: ['general'], shop_id: '' });
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{users.length} users</p>
        <button onClick={() => setShowForm(o => !o)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <UserPlus size={13} /> New user
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Create user</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Username</label>
              <input value={form.username} onChange={e => set('username', e.target.value)} required
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-600">Roles</label>
              <RolesSelector value={form.roles} onChange={v => set('roles', v)} />
              {form.roles.length === 0 && (
                <p className="text-xs text-red-500">At least one role is required</p>
              )}
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-600">Shop</label>
              <select value={form.shop_id} onChange={e => set('shop_id', e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">— none —</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || form.roles.length === 0}
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {isLoading && <div className="h-20 animate-pulse rounded-xl bg-gray-100" />}

      <ul className="flex flex-col gap-2">
        {users.map(u => <UserRow key={u.id} user={u} shops={shops} />)}
      </ul>
    </div>
  );
}
