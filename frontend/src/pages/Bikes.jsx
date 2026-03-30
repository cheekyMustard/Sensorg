import { useState } from 'react';
import { MapPin, Wrench, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useBikesInventory, useMoveBike, useDeleteBike } from '../hooks/useBikes.js';
import { useAdminShops } from '../hooks/useAdmin.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getShopMeta, SHOP_META } from '../utils/shopColors.js';
import ConfirmDialog from '../components/ConfirmDialog/ConfirmDialog.jsx';

function BikeCard({ bike, shops, isAdmin }) {
  const [moving,  setMoving]  = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [shopId,  setShopId]  = useState(bike.current_shop_id ?? '');
  const moveMutation          = useMoveBike();
  const deleteMutation        = useDeleteBike();

  async function save() {
    await moveMutation.mutateAsync({ id: bike.id, shop_id: shopId || null });
    setMoving(false);
  }

  return (
    <>
    <div className="rounded-xl border bg-white overflow-hidden"
         style={{ borderColor: bike.is_active ? '#E5E7EB' : '#F3F4F6' }}>
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Label + condition */}
        <div className="flex-1 min-w-0">
          <span className={`font-mono text-sm font-semibold ${bike.is_active ? 'text-gray-800' : 'text-gray-400'}`}>
            {bike.label}
          </span>
          {bike.notes && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 truncate">
              <Wrench size={11} className="shrink-0" />
              {bike.notes}
            </p>
          )}
        </div>

        {/* Status badge */}
        {!bike.is_active && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
            inactive
          </span>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { setShopId(bike.current_shop_id ?? ''); setMoving(m => !m); }}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-1"
            >
              <MapPin size={12} />
              Move
              {moving ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button
              onClick={() => setConfirm(true)}
              disabled={deleteMutation.isPending}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
              aria-label="Delete bike"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Admin: inline shop picker */}
      {moving && (
        <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2 bg-gray-50">
          <select
            value={shopId}
            onChange={e => setShopId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none bg-white"
          >
            <option value="">— unknown —</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={save}
            disabled={moveMutation.isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {moveMutation.isPending ? '…' : 'Save'}
          </button>
          <button
            onClick={() => setMoving(false)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>

    <ConfirmDialog
      open={confirm}
      title="Delete bike?"
      message={`Permanently delete ${bike.label}? This removes it from all delivery records too.`}
      confirmLabel="Delete"
      loading={deleteMutation.isPending}
      onConfirm={async () => { await deleteMutation.mutateAsync(bike.id); setConfirm(false); }}
      onCancel={() => setConfirm(false)}
    />
    </>
  );
}

function ShopGroup({ shopName, bikes, shops, isAdmin }) {
  const meta    = getShopMeta(shopName);
  const primary = meta?.primary ?? '#6B7280';
  const light   = meta?.light   ?? '#F9FAFB';
  const border  = meta?.border  ?? '#D1D5DB';
  const text    = meta?.text    ?? '#374151';

  const active   = bikes.filter(b => b.is_active);
  const inactive = bikes.filter(b => !b.is_active);

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: border }}>
      {/* Shop header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: light }}>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: primary }} />
          <span className="font-semibold text-sm" style={{ color: text }}>
            {shopName ?? 'Unknown location'}
          </span>
        </div>
        <span className="text-xs font-medium rounded-full px-2 py-0.5"
              style={{ background: primary + '22', color: text }}>
          {active.length} active{inactive.length > 0 ? ` · ${inactive.length} inactive` : ''}
        </span>
      </div>

      {/* Bike cards */}
      <div className="p-3 flex flex-col gap-2" style={{ background: '#FAFAFA' }}>
        {bikes.map(bike => (
          <BikeCard key={bike.id} bike={bike} shops={shops} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}

export default function Bikes() {
  const { user }                      = useAuth();
  const { data: bikes = [], isLoading } = useBikesInventory();
  const { data: shops = [] }           = useAdminShops();
  const [search, setSearch]            = useState('');
  const [filter, setFilter]            = useState('active'); // 'active' | 'all'

  const isAdmin = user?.roles?.includes('admin');

  const visible = bikes
    .filter(b => filter === 'all' ? true : b.is_active)
    .filter(b => !search || b.label.toLowerCase().includes(search.toLowerCase()));

  // Group by shop name (null → 'Unknown location')
  const groups = {};
  for (const bike of visible) {
    const key = bike.current_shop_name ?? null;
    if (!groups[key]) groups[key] = [];
    groups[key].push(bike);
  }

  // Sort: known shops first (by SHOP_META order), then unknown
  const shopOrder = SHOP_META.map(s => s.name);
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const ia = shopOrder.indexOf(a);
    const ib = shopOrder.indexOf(b);
    if (a === 'null' || a === null) return 1;
    if (b === 'null' || b === null) return -1;
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const totalActive = bikes.filter(b => b.is_active).length;

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-bold text-white">Bikes</h1>
        <p className="text-xs text-gray-400">{totalActive} active · {bikes.length} total</p>
      </div>

      {/* Search + filter */}
      <div className="px-4 pb-3 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search label…"
          className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none"
        />
        <div className="flex rounded-xl border border-gray-700 overflow-hidden text-xs">
          {['active', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 capitalize transition-colors ${
                filter === f ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 px-4">
        {isLoading && (
          <>
            <div className="h-32 animate-pulse rounded-2xl bg-gray-800" />
            <div className="h-32 animate-pulse rounded-2xl bg-gray-800" />
          </>
        )}

        {!isLoading && sortedKeys.map(key => (
          <ShopGroup
            key={key}
            shopName={key === 'null' ? null : key}
            bikes={groups[key]}
            shops={shops}
            isAdmin={isAdmin}
          />
        ))}

        {!isLoading && visible.length === 0 && (
          <p className="rounded-2xl border border-gray-700 px-4 py-8 text-center text-sm text-gray-500">
            No bikes found
          </p>
        )}
      </div>
    </div>
  );
}
