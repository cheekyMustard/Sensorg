import { useState } from 'react';
import { ChevronDown, Plus, Wrench, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCreateRepairRequest, useDeleteRepairRequest, useAdvanceRepairRequest } from '../../hooks/useRepairRequests.js';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog.jsx';
import { formatDate } from '../../utils/formatDate.js';

const STATUS_NEXT = {
  open:        { to: 'in_progress', label: 'Take',      confirmTitle: 'Take this repair?',    confirmMsg: 'Mark yourself as handling this repair request.' },
  in_progress: { to: 'done',        label: 'Mark done', confirmTitle: 'Mark repair as done?', confirmMsg: 'Confirm the repair has been completed.' },
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

// ── Add Form ─────────────────────────────────────────────────────────────────
function AddRepairForm({ onClose }) {
  const createMutation = useCreateRepairRequest();
  const [bikeInput,   setBikeInput]   = useState('');
  const [bikeLabels,  setBikeLabels]  = useState([]);
  const [description, setDescription] = useState('');
  const [isRoadbike,  setIsRoadbike]  = useState(false);
  const [error,       setError]       = useState(null);

  function addBike(raw) {
    const label = raw.trim().toUpperCase();
    if (!label) return;
    if (!bikeLabels.includes(label)) setBikeLabels(prev => [...prev, label]);
    setBikeInput('');
  }

  function handleBikeKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addBike(bikeInput);
    }
    if (e.key === 'Backspace' && !bikeInput && bikeLabels.length) {
      setBikeLabels(prev => prev.slice(0, -1));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const labels = [...bikeLabels, ...(bikeInput.trim() ? [bikeInput.trim().toUpperCase()] : [])];
    if (!labels.length) { setError('Add at least one bike label.'); return; }
    setError(null);
    await createMutation.mutateAsync({
      bike_labels:         labels,
      problem_description: description.trim() || undefined,
      is_roadbike:         isRoadbike,
    });
    onClose();
  }

  return (
    <div className="rounded-2xl border border-dashed border-red-400/40 bg-red-950/20 p-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-red-300 flex items-center gap-1.5">
          <Wrench size={14} /> New repair request
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Bike labels chip input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-400">Bike labels</label>
          <div
            className="flex flex-wrap gap-1.5 rounded-xl border border-gray-600 bg-gray-900/60 px-3 py-2 cursor-text"
            onClick={() => document.getElementById('repair-bike-input').focus()}
          >
            {bikeLabels.map(label => (
              <span key={label}
                className="flex items-center gap-1 rounded-full bg-red-900/60 px-2 py-0.5 text-xs font-medium text-red-200">
                {label}
                <button type="button" onClick={() => setBikeLabels(prev => prev.filter(l => l !== label))}
                  className="hover:text-white transition-colors leading-none">×</button>
              </span>
            ))}
            <input
              id="repair-bike-input"
              value={bikeInput}
              onChange={e => setBikeInput(e.target.value)}
              onKeyDown={handleBikeKeyDown}
              onBlur={() => addBike(bikeInput)}
              placeholder={bikeLabels.length ? '' : 'Type label, press Enter…'}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
            />
          </div>
          <p className="text-xs text-gray-600">Enter or comma to add each label</p>
        </div>

        {/* Problem description */}
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Problem description (optional)…"
          className="w-full rounded-xl border border-gray-600 bg-gray-900/60 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none resize-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/30 transition-shadow"
        />

        {/* Roadbike checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={isRoadbike}
              onChange={e => setIsRoadbike(e.target.checked)}
              className="sr-only"
            />
            <div
              className="flex h-5 w-5 items-center justify-center rounded border-2 transition-colors"
              style={{
                borderColor: isRoadbike ? '#EF4444' : '#4B5563',
                background:  isRoadbike ? '#EF4444' : 'transparent',
              }}
            >
              {isRoadbike && (
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-200">Roadbike</span>
            <span className="ml-1.5 text-xs text-gray-500">→ creates task to mark as "broken" in BRM</span>
          </div>
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {createMutation.error && <p className="text-xs text-red-400">Failed to save — try again</p>}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-xl py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
          style={{ background: '#B71C1C' }}
        >
          {createMutation.isPending ? 'Saving…' : '🔧 Log repair'}
        </button>
      </form>
    </div>
  );
}

// ── Repair Card ───────────────────────────────────────────────────────────────
function RepairCard({ rr }) {
  const { user } = useAuth();
  const advanceMutation = useAdvanceRepairRequest();
  const deleteMutation  = useDeleteRepairRequest();
  const [confirm, setConfirm]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canAct    = user?.roles?.some(r => ['mechanic', 'admin'].includes(r));
  const canDelete = user?.roles?.includes('admin') || rr.created_by_user_id === user?.id;
  const next      = STATUS_NEXT[rr.status];
  const style     = ageStyle(rr.arrival_date, rr.status);

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
            {rr.is_roadbike && (
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
                Roadbike
              </span>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
            {formatDate(rr.arrival_date)}
          </span>
        </div>

        {/* Problem description */}
        {rr.problem_description && (
          <p className="mt-2 text-xs text-gray-600 italic">{rr.problem_description}</p>
        )}

        {rr.status === 'done' && (
          <p className="mt-1 text-xs text-gray-400">✓ Done · moves to archive in ~2 days</p>
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
          <div className="flex items-center gap-1">
            {rr.taken_by_username && (
              <span className="text-xs text-gray-400 mr-1">{rr.taken_by_username}</span>
            )}
            <span className="rounded-full border bg-white px-2 py-0.5 text-xs capitalize"
              style={{ borderColor: '#D1D5DB', color: '#888' }}>
              {rr.status.replace('_', ' ')}
            </span>
            {canDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleteMutation.isPending}
                aria-label="Delete repair request"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
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
      <ConfirmDialog
        open={confirmDelete}
        title="Delete repair request?"
        message="This cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={async () => { await deleteMutation.mutateAsync(rr.id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function RepairRequestsSection({ repairRequests = [], loading, error, isOpen, onToggle }) {
  const [showAdd, setShowAdd] = useState(false);
  const open = repairRequests.filter(r => r.status !== 'done');

  return (
    <section className="mt-3">
      <div
        onClick={onToggle}
        aria-expanded={isOpen}
        role="button"
        className="flex w-full items-center justify-between px-4 py-3.5 transition-all cursor-pointer"
        style={{
          background:   '#B71C1C',
          borderRadius: isOpen ? '0.75rem 0.75rem 0 0' : '0.75rem',
          boxShadow:    isOpen ? 'none' : '0 3px 10px rgba(183,28,28,0.4)',
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
          <button
            onClick={e => { e.stopPropagation(); setShowAdd(v => !v); if (!isOpen) onToggle(); }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            title="Log repair"
          >
            <Plus size={16} />
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
          {showAdd && <AddRepairForm onClose={() => setShowAdd(false)} />}

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

          {!loading && !error && repairRequests.length === 0 && !showAdd && (
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
