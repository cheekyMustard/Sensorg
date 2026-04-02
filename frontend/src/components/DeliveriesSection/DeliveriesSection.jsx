import { ChevronDown, Plus } from 'lucide-react';
import RequestCard from '../RequestCard/RequestCard.jsx';

export default function DeliveriesSection({
  requests = [], loading, error,
  hasMore, loadMore, loadingMore,
  isOpen, onToggle, onAdd,
}) {
  return (
    <section>
      <div
        onClick={onToggle}
        aria-expanded={isOpen}
        role="button"
        className="flex w-full items-center justify-between px-4 py-3.5 transition-all cursor-pointer"
        style={{
          background: 'var(--brand)',
          borderRadius: isOpen ? '0.75rem 0.75rem 0 0' : '0.75rem',
          boxShadow: isOpen ? 'none' : '0 3px 10px rgba(232,119,42,0.4)',
        }}
      >
        <div className="flex flex-1 items-center gap-2">
          <span className="text-base font-bold tracking-tight text-white">
            Deliveries
            {requests.length > 0 && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
                {requests.length}
              </span>
            )}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onAdd(); }}
            aria-label="Add delivery"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <Plus size={16} className="text-white" />
          </button>
        </div>
        <div className="flex min-h-[48px] min-w-[48px] items-center justify-center -mr-2">
          <ChevronDown
            size={18}
            className="text-white"
            style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2 rounded-b-xl p-3" style={{ background: '#323232' }}>
          {loading && (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => (
                <div key={i} className="h-28 animate-pulse rounded-xl" style={{ background: '#3a3a3a' }} />
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
              Failed to load deliveries: {error.message}
            </p>
          )}

          {!loading && !error && requests.length === 0 && (
            <p className="rounded-xl px-4 py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              No active deliveries
            </p>
          )}

          {!loading && !error && requests.map(r => (
            <RequestCard key={r.id} request={r} />
          ))}

          {!loading && !error && hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full rounded-xl py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: 'rgba(232,119,42,0.15)', color: 'var(--brand)', border: '1px solid rgba(232,119,42,0.3)' }}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
