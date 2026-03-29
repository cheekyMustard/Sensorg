import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2, ImageOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUpdateKb, useDeleteKb } from '../../hooks/useKb.js';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog.jsx';
import ImageUploader from '../ImageUploader/ImageUploader.jsx';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function KbImage({ url, alt }) {
  const [err, setErr] = useState(false);
  const src = url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
  if (err) return (
    <div className="mb-2 flex items-center justify-center gap-1 rounded-lg bg-stone-100 py-3 text-xs text-stone-400">
      <ImageOff size={13} /> Image unavailable
    </div>
  );
  return (
    <img src={src} alt={alt} onError={() => setErr(true)}
      className="mb-2 w-full rounded-lg object-cover" style={{ maxHeight: 200 }} />
  );
}

const inputCls = 'rounded-lg border px-2 py-1 text-sm outline-none transition-shadow w-full';
const inputStyle = { borderColor: '#d0e8ee' };
function onFocus(e) { e.target.style.boxShadow = '0 0 0 2px var(--brand-blue)'; }
function onBlur(e)  { e.target.style.boxShadow = 'none'; }

export default function KbCard({ article }) {
  const { user } = useAuth();
  const updateMutation = useUpdateKb();
  const deleteMutation = useDeleteKb();

  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState({ title: article.title, content: article.content, category: article.category ?? '', image_url: article.image_url ?? null });
  const [confirm,  setConfirm]  = useState(false);

  const canManage = user?.roles?.some(r => ['admin', 'organiser', 'mechanic'].includes(r));

  function set(k, v) { setDraft(d => ({ ...d, [k]: v })); }

  async function saveEdit() {
    await updateMutation.mutateAsync({
      id: article.id,
      data: { title: draft.title, content: draft.content, category: draft.category || null, image_url: draft.image_url ?? null },
    });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft({ title: article.title, content: article.content, category: article.category ?? '', image_url: article.image_url ?? null });
  }

  return (
    <>
      <div className="rounded-xl bg-white overflow-hidden" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.2)', border: '1px solid #d8eef3' }}>
        {/* Header row */}
        <div className="flex items-start gap-2 px-4 py-3">
          <button
            onClick={() => !editing && setExpanded(e => !e)}
            className="flex-1 text-left min-w-0"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{article.title}</span>
              {article.category && (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: '#d8eef3', color: '#2a6a80' }}>
                  {article.category}
                </span>
              )}
              {article.shop_name && (
                <span className="rounded-full px-2 py-0.5 text-xs text-stone-400" style={{ background: '#f5f0eb' }}>
                  {article.shop_name}
                </span>
              )}
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {canManage && !editing && (
              <>
                <button onClick={() => { setEditing(true); setExpanded(true); }}
                  className="rounded-lg p-1 text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setConfirm(true)} disabled={deleteMutation.isPending}
                  className="rounded-lg p-1 text-stone-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-50 transition-colors">
                  <Trash2 size={13} />
                </button>
              </>
            )}
            {!editing && (
              <button onClick={() => setExpanded(e => !e)}
                className="rounded-lg p-1 text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            )}
          </div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="border-t px-4 py-3" style={{ borderColor: '#e8f4f8', background: '#f7fbfd' }}>
            {editing ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-stone-500">Title</label>
                  <input value={draft.title} onChange={e => set('title', e.target.value)}
                    className={`${inputCls} font-semibold`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-stone-500">Category <span className="font-normal text-stone-400">(optional)</span></label>
                  <select value={draft.category} onChange={e => set('category', e.target.value)}
                    className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">— No category —</option>
                    <option value="BRM">BRM (Bike Rental Manager)</option>
                    <option value="Bikes">Bikes</option>
                    <option value="Shop">Shop</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-stone-500">Content</label>
                  <textarea value={draft.content} onChange={e => set('content', e.target.value)}
                    rows={5}
                    className={`${inputCls} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <ImageUploader
                  value={draft.image_url}
                  onChange={url => set('image_url', url)}
                />
                {updateMutation.error && (
                  <p className="text-xs text-red-600">{updateMutation.error.message}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updateMutation.isPending}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ background: 'var(--brand-blue)' }}
                    onMouseEnter={e => { if (!updateMutation.isPending) e.currentTarget.style.background = '#3a7a8f'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--brand-blue)'}
                  >
                    {updateMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={cancelEdit}
                    className="rounded-lg border px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
                    style={{ borderColor: '#d0e8ee' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {article.image_url && (
                  <KbImage url={article.image_url} alt={article.title} />
                )}
                {article.content ? (
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{article.content}</p>
                ) : (
                  <p className="text-sm text-stone-400 italic">No content.</p>
                )}
                {article.author && (
                  <p className="mt-2 text-xs text-stone-400">by {article.author}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete article?"
        message="This will permanently remove the article."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={async () => { await deleteMutation.mutateAsync(article.id); setConfirm(false); }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
