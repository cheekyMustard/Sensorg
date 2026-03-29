import { useState } from 'react';
import { useAdminBikes, useUpdateAdminBike } from '../../hooks/useAdmin.js';
import { useAdminShops } from '../../hooks/useAdmin.js';

function BikeRow({ bike, shops }) {
  const [open, setOpen]   = useState(false);
  const [shopId, setShopId] = useState(bike.current_shop_id ?? '');
  const updateMutation    = useUpdateAdminBike();

  async function toggleActive() {
    await updateMutation.mutateAsync({ id: bike.id, data: { is_active: !bike.is_active } });
  }

  async function saveShop() {
    await updateMutation.mutateAsync({ id: bike.id, data: { current_shop_id: shopId || null } });
    setOpen(false);
  }

  return (
    <li className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(o => !o)}
            className="text-sm font-medium text-gray-800 hover:text-blue-600">
            {bike.label}
          </button>
          {!bike.is_active && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">inactive</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{bike.current_shop_name ?? '—'}</span>
          <button
            onClick={toggleActive}
            disabled={updateMutation.isPending}
            className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              bike.is_active
                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600'
                : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
            }`}
          >
            {bike.is_active ? 'active' : 'inactive'}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 shrink-0">Current shop</label>
          <select value={shopId} onChange={e => setShopId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">— unknown —</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={saveShop} disabled={updateMutation.isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {updateMutation.isPending ? '…' : 'Save'}
          </button>
          <button onClick={() => setOpen(false)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}

export default function BikesPanel() {
  const { data: bikes = [], isLoading } = useAdminBikes();
  const { data: shops = [] }            = useAdminShops();

  const [filter, setFilter] = useState('all');

  const visible = bikes.filter(b =>
    filter === 'all'      ? true :
    filter === 'active'   ? b.is_active :
    !b.is_active
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{bikes.length} bikes total</p>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {['all','active','inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 capitalize ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="h-20 animate-pulse rounded-xl bg-gray-100" />}

      <ul className="flex flex-col gap-2">
        {visible.map(b => <BikeRow key={b.id} bike={b} shops={shops} />)}
        {!isLoading && visible.length === 0 && (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
            No bikes found
          </p>
        )}
      </ul>
    </div>
  );
}
