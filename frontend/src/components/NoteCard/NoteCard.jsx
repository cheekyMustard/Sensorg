import { useState } from 'react';
import { Trash2, Pencil, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUpdateNote, useDeleteNote, useMarkNoteDone } from '../../hooks/useNotes.js';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog.jsx';
import { getShopMeta } from '../../utils/shopColors.js';
import { NOTE_CATEGORIES, categoryMeta } from '../../utils/noteCategories.js';

import { formatDate } from '../../utils/formatDate.js';

const inputCls = 'rounded-lg border px-2 py-1 text-sm outline-none transition-shadow w-full';
const inputStyle = { borderColor: '#e5d5c5' };
function onFocus(e) { e.target.style.boxShadow = '0 0 0 2px var(--brand-gold)'; }
function onBlur(e)  { e.target.style.boxShadow = 'none'; }

export default function NoteCard({ note }) {
  const { user }     = useAuth();
  const shopMeta     = getShopMeta(note.shop_name);
  const updateMutation   = useUpdateNote();
  const deleteMutation   = useDeleteNote();
  const doneMutation     = useMarkNoteDone();

  const [draft,   setDraft]   = useState(null);
  const [confirm, setConfirm] = useState(false);

  const canEdit   = user?.roles?.some(r => ['admin', 'organiser'].includes(r)) || note.created_by_user_id === user?.id;
  const canDelete = canEdit;
  const isDirty   = draft !== null;

  function startEdit() { setDraft({ title: note.title, content: note.content, category: note.category ?? '' }); }
  function cancelEdit() { setDraft(null); }
  async function saveEdit() {
    await updateMutation.mutateAsync({ id: note.id, data: { ...draft, category: draft.category || null } });
    setDraft(null);
  }

  const meta = note.category ? categoryMeta(note.category) : null;

  return (
    <>
      <div
        className="rounded-xl bg-white p-4 transition-opacity"
        style={{
          boxShadow:   '0 2px 10px rgba(0,0,0,0.2)',
          border:      '1px solid #f0e8de',
          borderLeft:  shopMeta ? `4px solid ${shopMeta.primary}` : '1px solid #f0e8de',
          opacity:     note.is_done ? 0.6 : 1,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          {isDirty ? (
            <input
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              className={`${inputCls} font-semibold`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          ) : (
            <p className="text-base font-semibold" style={{ color: 'var(--charcoal)' }}>{note.title}</p>
          )}
          <span className="shrink-0 text-xs text-stone-400">{formatDate(note.created_at)}</span>
        </div>

        {/* Tags row: shop + category */}
        <div className="mt-1 flex flex-wrap gap-1.5">
          {note.shop_name && (
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: shopMeta ? shopMeta.light : '#F5EDE0', color: shopMeta ? shopMeta.text : '#8B6040', border: `1px solid ${shopMeta ? shopMeta.border : '#e5c9a5'}` }}
            >
              {note.shop_name}
            </span>
          )}
          {meta && !isDirty && (
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.icon} {meta.label}
            </span>
          )}
        </div>

        <div className="mt-2">
          {isDirty ? (
            <>
              <textarea
                value={draft.content}
                onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
                rows={3}
                className={`${inputCls} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
              {/* Category picker in edit mode */}
              <select
                value={draft.category}
                onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                className={`${inputCls} mt-2`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              >
                <option value="">— No category —</option>
                {NOTE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </>
          ) : (
            note.content && (
              <p className="whitespace-pre-wrap text-sm italic text-stone-600">{note.content}</p>
            )
          )}
        </div>

        {note.author && !isDirty && (
          <p className="mt-2 text-xs text-stone-400">by {note.author}</p>
        )}

        {note.is_done && !isDirty && (
          <p className="mt-1 text-xs text-green-600 font-medium">
            ✓ Done · moves to archive in ~1 day
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {isDirty ? (
              <>
                <button
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: 'var(--brand-gold)' }}
                  onMouseEnter={e => { if (!updateMutation.isPending) e.currentTarget.style.background = '#b8895a'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--brand-gold)'}
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border px-3 py-1 text-xs text-stone-600 transition-colors hover:bg-stone-50"
                  style={{ borderColor: '#e0d0c0' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              canEdit && (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1 rounded-lg border px-3 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-50"
                  style={{ borderColor: '#e0d0c0' }}
                >
                  <Pencil size={11} /> Edit
                </button>
              )
            )}
          </div>

          {!isDirty && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => doneMutation.mutate({ id: note.id, done: !note.is_done })}
                disabled={doneMutation.isPending}
                aria-label={note.is_done ? 'Mark as not done' : 'Mark as done'}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:opacity-50"
                style={note.is_done
                  ? { borderColor: '#22c55e', color: '#22c55e', background: '#f0fdf4' }
                  : { borderColor: '#D4A574', color: '#9C7A50', background: '#FDF8F3' }
                }
              >
                {note.is_done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {note.is_done ? 'Done' : 'Done?'}
              </button>
              {canDelete && (
                <button
                  onClick={() => setConfirm(true)}
                  disabled={deleteMutation.isPending}
                  aria-label="Delete note"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-stone-300 hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {updateMutation.error && (
          <p className="mt-2 text-xs text-red-600">{updateMutation.error.message}</p>
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete note?"
        message="This cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={async () => { await deleteMutation.mutateAsync(note.id); setConfirm(false); }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
