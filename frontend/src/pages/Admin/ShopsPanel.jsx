import { useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { useAdminShops, useCreateAdminShop, useUpdateAdminShop } from '../../hooks/useAdmin.js';

function ShopRow({ shop }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(shop.name);
  const updateMutation        = useUpdateAdminShop();

  async function save() {
    await updateMutation.mutateAsync({ id: shop.id, data: { name } });
    setEditing(false);
  }

  function cancel() { setName(shop.name); setEditing(false); }

  return (
    <li className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
      {editing ? (
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          className="flex-1 rounded-lg border border-blue-400 px-2 py-1 text-sm focus:outline-none"
        />
      ) : (
        <div>
          <span className="text-sm font-medium text-gray-800">{shop.name}</span>
          <span className="ml-2 text-xs text-gray-400">{shop.user_count} users</span>
        </div>
      )}

      <div className="ml-3 flex items-center gap-1">
        {editing ? (
          <>
            <button onClick={save} disabled={updateMutation.isPending}
              className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700 disabled:opacity-50">
              <Check size={13} />
            </button>
            <button onClick={cancel}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50">
              <X size={13} />
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <Pencil size={13} />
          </button>
        )}
      </div>
    </li>
  );
}

export default function ShopsPanel() {
  const { data: shops = [], isLoading } = useAdminShops();
  const createMutation                  = useCreateAdminShop();

  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    await createMutation.mutateAsync({ name });
    setName('');
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{shops.length} shops</p>
        <button onClick={() => setShowForm(o => !o)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={13} /> New shop
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Shop name"
            required
            autoFocus
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" disabled={createMutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {createMutation.isPending ? '…' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowForm(false)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </form>
      )}

      {isLoading && <div className="h-20 animate-pulse rounded-xl bg-gray-100" />}

      <ul className="flex flex-col gap-2">
        {shops.map(s => <ShopRow key={s.id} shop={s} />)}
      </ul>
    </div>
  );
}
