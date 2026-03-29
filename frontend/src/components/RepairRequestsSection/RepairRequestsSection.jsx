import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAdvanceRepairRequest } from '../../hooks/useRepairRequests.js';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog.jsx';
import { useState } from 'react';

const STATUS_NEXT = {
  open:        { to: 'in_progress', label: 'Take',       confirmTitle: 'Take this repair?',       confirmMsg: 'Mark yourself as handling this repair request.' },
  in_progress: { to: 'done',        label: 'Mark done',  confirmTitle: 'Mark repair as done?',     confirmMsg: 'Confirm the repair has been completed.' },
};

/** Color the card border/badge by age (days since arrival) */
function ageStyle(arrivalDate, status) {
  if (status === 'done') return { border: '#9CA3AF', badge: 'bg-gray-100 text-gray-400' };
  const days = Math.floor((Date.now() - new Date(arrivalDate).getTime()) / 86400000);
  if (days <= 0) return { border: '#22C55E', badge: 'bg-green-100 text-green-700' };
  if (days <= 2) return { border: '#EAB308', badge: 'bg-yellow-100 text-yellow-700' };
  if (days <= 5) return { border: '#F97316', badge: 'bg-orange-100 text-orange-700' };
  return { border: '#EF4444', badge: 'bg-red-100 text-red-600' };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RepairCard({ rr }) {
  const { user } = useAuth();
  const advanceMutation = useAdvanceRepairRequest();
  const [confirm, setConfirm] = useState(null);

  const canAct = user?.roles?.some(r => ['mechanic', 'admin'].includes(r));
  const next   = STATUS_NEXT[rr.status];
  const style  = ageStyle(rr.arrival_date, rr.status);

  return (
    <>
      <div
        className="rounded-xl bg-white p-4"
        style={{ border: `2px solid ${style.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1 min-w-0">
            {rr.bike_labels.map(label => (
              <span key={label}
                className="rounded-full border px-2 py-0.5 text-xs font-medium"
                style={{ borderColor: '#D1D5DB', color: '#374151', background: '#F9FAFB' }}>
                {label}
              </span>
            ))}
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
            {formatDate(rr.arrival_date)}
          </span>
        </div>

        {/* Problem description */}
        {rr.problem_description && (
          <p className="mt-2 text-xs text-gray-600 italic">{rr.problem_description}</p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canAct && next && rr.status !== 'done' && (
              <button
                onClick={() => setConfirm(next)}
                disabled={advanceMutation.isPending}
                className="rounded-lg border px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: '#D1D5DB', color: '#374151', background: '#fff' }}
              >
                {next.label}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {rr.taken_by_username && (
              <span className="text-xs text-gray-400">{rr.taken_by_username}</span>
            )}
            <span className="rounded-full border bg-white px-2 py-0.5 text-xs capitalize"
              style={{ borderColor: '#D1D5DB', color: '#888' }}>
              {rr.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.confirmTitle ?? ''}
        message={confirm?.confirmMsg}
        confirmLabel="Yes"
        loading={advanceMutation.isPending}
        onConfirm={async () => {
          await advanceMutation.mutateAsync({ id: rr.id, to: confirm.to });
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

export default function RepairRequestsSection({ repairRequests = [], loading, error, isOpen, onToggle }) {
  const open = repairRequests.filter(r => r.status !== 'done');

  return (
    <section className="mt-3">
      <div
        onClick={onToggle}
        aria-expanded={isOpen}
        role="button"
        className="flex w-full items-center justify-between px-4 py-3.5 transition-all cursor-pointer"
        style={{
          background:    '#B71C1C',
          borderRadius:  isOpen ? '0.75rem 0.75rem 0 0' : '0.75rem',
          boxShadow:     isOpen ? 'none' : '0 3px 10px rgba(183,28,28,0.4)',
        }}
      >
        <div className="flex flex-1 items-center gap-2">
          <span className="text-base font-bold tracking-tight text-white">
            Repair Requests
            {open.length > 0 && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
                {open.length}
              </span>
            )}
          </span>
        </div>
        <ChevronDown
          size={18}
          className="text-white"
          style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2 rounded-b-xl p-3" style={{ background: '#323232' }}>
          {loading && (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: '#3a3a3a' }} />
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
              Failed to load repair requests: {error.message}
            </p>
          )}

          {!loading && !error && repairRequests.length === 0 && (
            <p className="rounded-xl px-4 py-6 text-center text-sm"
              style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              No repair requests
            </p>
          )}

          {!loading && !error && repairRequests.map(rr => (
            <RepairCard key={rr.id} rr={rr} />
          ))}
        </div>
      )}
    </section>
  );
}
