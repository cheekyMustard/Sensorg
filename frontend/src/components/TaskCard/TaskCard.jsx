import { useState } from 'react';
import { Trash2, Pencil, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCompleteTask, useUncompleteTask, useUpdateTask, useDeleteTask, useApproveTask, useRejectTask } from '../../hooks/useTasks.js';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog.jsx';
import { getShopMeta } from '../../utils/shopColors.js';
import { RECURRENCE_OPTIONS, parseRecurrenceKey, recurrenceKey, recurrenceLabel } from '../../utils/recurrence.js';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

const inputCls = 'rounded-lg border px-2 py-1 text-sm outline-none transition-shadow w-full';
const inputStyle = { borderColor: '#dceedd' };
function onFocus(e) { e.target.style.boxShadow = '0 0 0 2px var(--brand-green)'; }
function onBlur(e)  { e.target.style.boxShadow = 'none'; }

export default function TaskCard({ task }) {
  const { user }     = useAuth();
  const shopMeta     = getShopMeta(task.shop_name);
  const completeMutation   = useCompleteTask();
  const uncompleteMutation = useUncompleteTask();
  const updateMutation     = useUpdateTask();
  const deleteMutation     = useDeleteTask();

  const initialRecurrence = recurrenceKey(task.recurrence_unit ?? 'day', task.recurrence_interval ?? 1);
  const [editing,    setEditing]    = useState(false);
  const [draft,      setDraft]      = useState({ title: task.title, description: task.description, recurrence: initialRecurrence });
  const [confirm,    setConfirm]    = useState(false);

  const approveMutation = useApproveTask();
  const rejectMutation  = useRejectTask();

  const isCompleted     = !!task.completion_id;
  const canManage       = user?.roles?.some(r => ['admin', 'organiser'].includes(r));
  const isPending       = completeMutation.isPending || uncompleteMutation.isPending;
  const approvalStatus  = task.approval_status ?? 'approved';
  const isApprovalPending = approvalStatus === 'pending';
  const isRejected      = approvalStatus === 'rejected';

  function toggleComplete() {
    if (isPending) return;
    isCompleted ? uncompleteMutation.mutate(task.id) : completeMutation.mutate(task.id);
  }

  async function saveEdit() {
    const { recurrence, ...rest } = draft;
    await updateMutation.mutateAsync({ id: task.id, data: { ...rest, ...parseRecurrenceKey(recurrence) } });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft({ title: task.title, description: task.description, recurrence: initialRecurrence });
  }

  const badge = task.recurrence_unit ? recurrenceLabel(task.recurrence_unit, task.recurrence_interval ?? 1) : null;

  return (
    <>
      <div
        className="rounded-xl bg-white p-4 transition-colors"
        style={{
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          border: isRejected ? '1px solid #fca5a5'
            : isApprovalPending ? '1px solid #fde68a'
            : isCompleted ? '1px solid #c8e6c9'
            : '1px solid #e8f0e8',
          background: isRejected ? '#fff5f5'
            : isApprovalPending ? '#fffbeb'
            : isCompleted ? '#f0faf0'
            : '#fff',
          opacity: isCompleted ? 0.55 : (isRejected || isApprovalPending) && !canManage ? 0.75 : 1,
        }}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={toggleComplete}
            disabled={isPending || isApprovalPending || isRejected}
            aria-label={isCompleted ? 'Mark undone' : 'Mark done'}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-50"
            style={{
              borderColor: isCompleted ? 'var(--brand-green)' : '#bbb',
              background: isCompleted ? 'var(--brand-green)' : 'transparent',
            }}
            onMouseEnter={e => { if (!isCompleted && !isPending) e.currentTarget.style.borderColor = 'var(--brand-green)'; }}
            onMouseLeave={e => { if (!isCompleted) e.currentTarget.style.borderColor = '#bbb'; }}
          >
            {isCompleted && <Check size={11} strokeWidth={3} className="text-white" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-2">
                <input
                  value={draft.title}
                  onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  className={`${inputCls} font-semibold`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
                <textarea
                  value={draft.description}
                  onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  rows={2}
                  className={`${inputCls} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-stone-500">Recurrence</label>
                  <select value={draft.recurrence} onChange={e => setDraft(d => ({ ...d, recurrence: e.target.value }))}
                    className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                    {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updateMutation.isPending}
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ background: 'var(--brand-green)' }}
                    onMouseEnter={e => { if (!updateMutation.isPending) e.currentTarget.style.background = '#4a9050'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--brand-green)'}
                  >
                    {updateMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={cancelEdit}
                    className="rounded-lg border px-3 py-1 text-xs text-stone-600 hover:bg-stone-50"
                    style={{ borderColor: '#dceedd' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className={`text-base font-semibold ${isCompleted ? 'line-through' : ''}`}
                  style={{ color: isCompleted ? 'var(--brand-green)' : 'var(--charcoal)' }}>
                  {task.title}
                </p>
                {task.description && (
                  <p className={`mt-0.5 text-sm ${isCompleted ? '' : 'text-stone-500'}`}
                    style={isCompleted ? { color: 'var(--brand-green)', opacity: 0.75 } : {}}>
                    {task.description}
                  </p>
                )}
                {(badge || task.shop_name) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {badge && (
                      <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: '#e8f5e8', color: '#4a7a4b' }}>
                        ↻ {badge}
                      </span>
                    )}
                    {task.shop_name && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: shopMeta ? shopMeta.light : '#f5f0eb', color: shopMeta ? shopMeta.text : '#888', border: `1px solid ${shopMeta ? shopMeta.border : '#e0d5cc'}` }}>
                        {task.shop_name}
                      </span>
                    )}
                  </div>
                )}
                {isCompleted && task.completed_by_username && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--brand-green)' }}>
                    ✓ {task.completed_by_username} · {formatTime(task.completed_at)}
                  </p>
                )}
                {isApprovalPending && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">
                      Pending approval
                    </span>
                    {canManage && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(task.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="rounded-lg px-2 py-0.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(task.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="rounded-lg px-2 py-0.5 text-xs font-semibold text-white bg-red-400 hover:bg-red-500 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
                {isRejected && (
                  <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600">
                    Rejected
                  </span>
                )}
              </>
            )}
          </div>

          {canManage && !editing && (
            <div className="flex items-center shrink-0">
              <button onClick={() => setEditing(true)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={() => setConfirm(true)} disabled={deleteMutation.isPending}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-50 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete task?"
        message="This will permanently remove the task and all its history."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={async () => { await deleteMutation.mutateAsync(task.id); setConfirm(false); }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
