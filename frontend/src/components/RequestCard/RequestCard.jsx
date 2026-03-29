import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getColorByDue } from '../../utils/getColorByDue.js';
import { getShopMeta } from '../../utils/shopColors.js';
import { useUpdateRequest, useChangeStatus, useDeleteRequest } from '../../hooks/useRequests.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog.jsx';

function ShopChip({ name }) {
  const meta = getShopMeta(name);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: meta ? meta.light  : '#f5f5f5',
        color:      meta ? meta.text   : '#555',
        border:     `1px solid ${meta ? meta.border : '#ddd'}`,
      }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: meta ? meta.primary : '#aaa', flexShrink: 0 }}
      />
      {name}
    </span>
  );
}

const STATUS_TRANSITIONS = {
  open:        { to: 'in_progress', label: 'Take job',  confirmTitle: 'Take this job?',         confirmMsg: 'Are you sure you want to take this job?' },
  in_progress: { to: 'done',        label: 'Mark done', confirmTitle: 'Mark as done?',           confirmMsg: 'Is the bike changed in the system?' },
};

const ROLE_CAN_TRANSITION = {
  open:        ['driver', 'admin'],
  in_progress: ['driver', 'admin'],
};

const ROLE_CAN_DELETE = ['organiser', 'admin'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const editInputCls = 'rounded-lg border px-3 py-1.5 text-sm outline-none transition-shadow w-full';
const editInputStyle = { borderColor: 'var(--brand-border)' };
function onFocus(e) { e.target.style.boxShadow = '0 0 0 2px var(--brand)'; }
function onBlur(e)  { e.target.style.boxShadow = 'none'; }

/** For repair deliveries: green=today, yellow=1-2d, orange=3-5d, red=6+d */
function getRepairAgeColors(createdAt, status) {
  if (status === 'done' || status === 'cancelled') {
    return { bg: 'bg-gray-100', border: 'border-gray-300', badge: 'bg-gray-200 text-gray-500' };
  }
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days <= 0) return { bg: 'bg-green-50',  border: 'border-green-400',  badge: 'bg-green-100 text-green-700'  };
  if (days <= 2) return { bg: 'bg-yellow-50', border: 'border-yellow-400', badge: 'bg-yellow-100 text-yellow-700' };
  if (days <= 5) return { bg: 'bg-orange-50', border: 'border-orange-400', badge: 'bg-orange-100 text-orange-700' };
  return              { bg: 'bg-red-50',    border: 'border-red-400',    badge: 'bg-red-100 text-red-600'      };
}

export default function RequestCard({ request }) {
  const { user } = useAuth();
  const qc       = useQueryClient();
  const isRepair = request.reason === 'repair';
  const colors   = isRepair
    ? getRepairAgeColors(request.created_at, request.status)
    : getColorByDue(request.date_rental, request.status);

  // ── Draft state for inline editing ───────────────────────────────────────
  const [draft, setDraft]     = useState(null);   // null = not editing
  const [confirm, setConfirm] = useState(null);   // { to, title, message }

  const isDirty = draft !== null;

  const updateMutation = useUpdateRequest();
  const statusMutation = useChangeStatus();
  const deleteMutation = useDeleteRequest();

  // ── Helpers ───────────────────────────────────────────────────────────────
  function startEdit() {
    setDraft({ date_rental: request.date_rental, reason: request.reason, note: request.note ?? '' });
  }

  function cancelEdit() { setDraft(null); }

  async function saveEdit() {
    await updateMutation.mutateAsync({
      id: request.id,
      data: { ...draft, note: draft.note || null, version: request.version },
    });
    setDraft(null);
  }

  function handleStatusClick(to, title, message) {
    setConfirm({ to, title, message });
  }

  async function confirmStatusChange() {
    await statusMutation.mutateAsync({ id: request.id, to: confirm.to });
    setConfirm(null);
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(request.id);
  }

  // ── Permissions ───────────────────────────────────────────────────────────
  const transition     = STATUS_TRANSITIONS[request.status];
  const canTransition  = transition && ROLE_CAN_TRANSITION[request.status]?.some(r => user?.roles?.includes(r));
  const canDelete      = ROLE_CAN_DELETE.some(r => user?.roles?.includes(r)) || request.created_by_user_id === user?.id;
  const isGray         = request.status === 'done' || request.status === 'cancelled';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`rounded-xl border-2 ${colors.border} ${isDirty ? '' : colors.bg} p-4 transition-colors`}
        style={isDirty ? { background: '#FFF5EE', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' } : { boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
      >

        {/* Header row: route + date badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ShopChip name={request.from_shop_name} />
              <span className="text-xs text-gray-400">→</span>
              <ShopChip name={request.to_shop_name} />
            </div>
            <p className="mt-0.5 text-xs text-gray-500 capitalize">{request.reason}</p>
          </div>

          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${colors.badge}`}>
            {isRepair ? formatDate(request.created_at) : formatDate(request.date_rental)}
          </span>
        </div>

        {/* Bikes chips */}
        {request.bikes?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {request.bikes.map(b => (
              <span key={b.id} className="rounded-full bg-white border px-2 py-0.5 text-xs" style={{ borderColor: 'var(--brand-border)', color: 'var(--charcoal)' }}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Note (read view) */}
        {!isDirty && request.note && (
          <p className="mt-2 text-xs text-gray-500 italic">{request.note}</p>
        )}

        {/* Inline edit fields */}
        {isDirty && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl p-3" style={{ background: 'rgba(232,119,42,0.06)', border: '1px solid var(--brand-border)' }}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>Date</label>
              <input
                type="date"
                value={draft.date_rental}
                onChange={e => setDraft(d => ({ ...d, date_rental: e.target.value }))}
                className={editInputCls} style={editInputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>Reason</label>
              <select
                value={draft.reason}
                onChange={e => setDraft(d => ({ ...d, reason: e.target.value }))}
                className={editInputCls} style={editInputStyle} onFocus={onFocus} onBlur={onBlur}
              >
                <option value="rental">Rental</option>
                <option value="repair">Repair</option>
                <option value="return">Return</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>
                {draft.reason === 'repair' ? 'Problem description' : <>Note <span className="font-normal text-stone-400">(optional)</span></>}
              </label>
              <textarea
                value={draft.note}
                onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
                rows={2}
                required={draft.reason === 'repair'}
                placeholder={draft.reason === 'repair' ? 'Describe the problem…' : 'Any extra info…'}
                className={`${editInputCls} resize-none`} style={editInputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {/* Status transition button */}
            {canTransition && !isDirty && (
              <button
                onClick={() => handleStatusClick(transition.to, transition.confirmTitle, transition.confirmMsg)}
                disabled={statusMutation.isPending}
                className="rounded-lg border px-3 py-1 text-xs font-medium transition-colors hover:bg-orange-50 disabled:opacity-50"
                style={{ borderColor: 'var(--brand-border)', color: 'var(--charcoal)', background: '#fff' }}
              >
                {transition.label}
              </button>
            )}

            {/* Edit / Save / Cancel */}
            {!isDirty ? (
              !isGray && (
                <button
                  onClick={startEdit}
                  className="rounded-lg border px-3 py-1 text-xs font-medium transition-colors hover:bg-orange-50"
                  style={{ borderColor: 'var(--brand-border)', color: 'var(--charcoal)', background: '#fff' }}
                >
                  Edit
                </button>
              )
            ) : (
              <>
                <button
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: 'var(--brand)' }}
                  onMouseEnter={e => { if (!updateMutation.isPending) e.currentTarget.style.background = 'var(--brand-dark)'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border px-3 py-1 text-xs font-medium transition-colors hover:bg-orange-50"
                  style={{ borderColor: 'var(--brand-border)', color: 'var(--charcoal)', background: '#fff' }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Status badge + delete */}
          <div className="flex items-center gap-2">
            <span className="rounded-full border bg-white px-2 py-0.5 text-xs capitalize" style={{ borderColor: 'var(--brand-border)', color: '#888' }}>
              {request.status.replace('_', ' ')}
            </span>
            {canDelete && !isDirty && (
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                aria-label="Delete request"
                className="text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Inline error — special message for version conflicts */}
        {updateMutation.error && (
          updateMutation.error.status === 409 ? (
            <p className="mt-2 text-xs text-red-600">
              Outdated — someone else changed this.{' '}
              <button
                onClick={() => { qc.invalidateQueries({ queryKey: ['requests'] }); setDraft(null); }}
                className="underline font-medium"
              >
                Reload
              </button>
            </p>
          ) : (
            <p className="mt-2 text-xs text-red-600">{updateMutation.error.message}</p>
          )
        )}
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message}
        confirmLabel="Yes"
        loading={statusMutation.isPending}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
