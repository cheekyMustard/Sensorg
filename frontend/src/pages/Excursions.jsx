import { useState } from 'react';
import { Plus, Trash2, X, Globe, ImageOff } from 'lucide-react';
import ImageUploader from '../components/ImageUploader/ImageUploader.jsx';
import { useExcursions, useCreateExcursion, useDeleteExcursion, useApproveExcursion, useRejectExcursion } from '../hooks/useExcursions.js';
import ImageLightbox from '../components/ImageLightbox/ImageLightbox.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useShops } from '../hooks/useRequests.js';
import ConfirmDialog from '../components/ConfirmDialog/ConfirmDialog.jsx';

// ── Company colour palette ──────────────────────────────────────────────────
const COMPANY_COLORS = {
  'LCT':         { primary: '#1565C0', light: '#E3F2FD', border: '#90CAF9', text: '#1565C0' },
  'First Minute':{ primary: '#2E7D32', light: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' },
  'Lanzabuggy':  { primary: '#E65100', light: '#FFF3E0', border: '#FFCC80', text: '#E65100' },
  'Paracraft':   { primary: '#6A1B9A', light: '#F3E5F5', border: '#CE93D8', text: '#6A1B9A' },
};
const FALLBACK_COLOR = { primary: '#546E7A', light: '#ECEFF1', border: '#90A4AE', text: '#37474F' };

function companyColor(name) {
  return COMPANY_COLORS[name] ?? FALLBACK_COLOR;
}

const KNOWN_COMPANIES = ['LCT', 'First Minute', 'Lanzabuggy', 'Paracraft'];

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const inputCls = 'rounded-lg border px-3 py-2 text-sm outline-none transition-shadow w-full bg-white';
const inputStyle = { borderColor: '#D1D5DB' };
function onFocus(e) { e.target.style.boxShadow = '0 0 0 2px #6B7280'; }
function onBlur(e)  { e.target.style.boxShadow = 'none'; }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Add form modal ──────────────────────────────────────────────────────────
function AddForm({ onClose }) {
  const { user, activeShop } = useAuth();
  const { data: shops = [] }  = useShops();
  const createMutation        = useCreateExcursion();

  const [form, setForm] = useState({
    company:   '',
    topic:     '',
    note:      '',
    image_url: '',
    shop_id:   activeShop?.id ?? user?.shop_id ?? '',
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    await createMutation.mutateAsync({
      company:   form.company,
      topic:     form.topic,
      note:      form.note     || undefined,
      image_url: form.image_url || undefined,
      shop_id:   form.shop_id  || null,
    });
    onClose();
  }

  const canPickShop = user?.roles?.some(r => ['admin', 'organiser'].includes(r));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white px-5 pb-8 pt-5 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ borderTop: '3px solid #546E7A' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">New excursion entry</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Company */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Company</label>
            <input
              list="company-list"
              value={form.company}
              onChange={e => set('company', e.target.value)}
              required
              placeholder="Select or type company name…"
              className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
            <datalist id="company-list">
              {KNOWN_COMPANIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Topic */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Topic</label>
            <input
              value={form.topic}
              onChange={e => set('topic', e.target.value)}
              required
              placeholder="e.g. Time change, Pickup days, Price update…"
              className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Note <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              rows={3}
              placeholder="Details, pickup times, instructions…"
              className={`${inputCls} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Image */}
          <ImageUploader value={form.image_url || null} onChange={url => set('image_url', url ?? '')} />

          {/* Shop scope */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Visible to</label>
            {canPickShop ? (
              <select value={form.shop_id} onChange={e => set('shop_id', e.target.value)}
                className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                <option value="">All shops (global)</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <input
                readOnly
                value={shops.find(s => s.id === form.shop_id)?.name ?? activeShop?.name ?? 'My shop'}
                className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`}
                style={inputStyle}
              />
            )}
          </div>

          {createMutation.error && (
            <p className="text-xs text-red-600">{createMutation.error.message}</p>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="mt-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: '#546E7A' }}
          >
            {createMutation.isPending ? 'Creating…' : 'Create entry'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Single entry card ───────────────────────────────────────────────────────
function ExcursionCard({ entry }) {
  const { user }          = useAuth();
  const deleteMutation    = useDeleteExcursion();
  const approveMutation   = useApproveExcursion();
  const rejectMutation    = useRejectExcursion();
  const [confirm,   setConfirm]   = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const [lightbox,  setLightbox]  = useState(false);

  const colors            = companyColor(entry.company);
  const canDelete         = user?.roles?.includes('admin') || entry.created_by_user_id === user?.id;
  const canApprove        = user?.roles?.some(r => ['admin', 'organiser'].includes(r));
  const approvalStatus    = entry.approval_status ?? 'approved';
  const isApprovalPending = approvalStatus === 'pending';
  const isRejected        = approvalStatus === 'rejected';

  return (
    <>
      <div
        className="rounded-xl bg-white overflow-hidden shadow-sm"
        style={{
          borderLeft: `4px solid ${isRejected ? '#f87171' : isApprovalPending ? '#fbbf24' : colors.primary}`,
          border: isRejected ? '1px solid #fca5a5' : isApprovalPending ? '1px solid #fde68a' : '1px solid #f3f4f6',
          opacity: (isRejected || isApprovalPending) && !canApprove ? 0.75 : 1,
        }}
      >

        {/* Image — small thumbnail, click to expand */}
        {entry.image_url && !imgError && (
          <>
            <img
              src={entry.image_url.startsWith('/uploads/') ? `${API_BASE}${entry.image_url}` : entry.image_url}
              alt={entry.topic}
              className="cursor-zoom-in object-cover"
              style={{ maxHeight: 100, width: 'auto', maxWidth: '100%' }}
              onError={() => setImgError(true)}
              onClick={() => setLightbox(true)}
            />
            {lightbox && (
              <ImageLightbox
                src={entry.image_url.startsWith('/uploads/') ? `${API_BASE}${entry.image_url}` : entry.image_url}
                alt={entry.topic}
                onClose={() => setLightbox(false)}
              />
            )}
          </>
        )}
        {entry.image_url && imgError && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400 bg-gray-50">
            <ImageOff size={14} /> Image could not be loaded
          </div>
        )}

        <div className="p-4">
          {/* Topic */}
          <p className="font-semibold text-gray-800 text-sm">{entry.topic}</p>

          {/* Note */}
          {entry.note && (
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-600">{entry.note}</p>
          )}

          {/* Approval status + actions */}
          {(isApprovalPending || isRejected) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isRejected ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                {isRejected ? 'Rejected' : 'Pending approval'}
              </span>
              {canApprove && isApprovalPending && (
                <>
                  <button
                    onClick={() => approveMutation.mutate(entry.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="rounded-lg px-2 py-0.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(entry.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="rounded-lg px-2 py-0.5 text-xs font-semibold text-white bg-red-400 hover:bg-red-500 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {entry.shop_name ? (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: colors.light, color: colors.text, border: `1px solid ${colors.border}` }}>
                  {entry.shop_name}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-gray-400 bg-gray-100">
                  <Globe size={10} /> All shops
                </span>
              )}
              <span className="text-xs text-gray-400">
                {entry.author ? `by ${entry.author}` : ''} · {formatDate(entry.created_at)}
              </span>
            </div>

            {canDelete && (
              <button
                onClick={() => setConfirm(true)}
                disabled={deleteMutation.isPending}
                className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete entry?"
        message="This cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={async () => { await deleteMutation.mutateAsync(entry.id); setConfirm(false); }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}

// ── Company group ───────────────────────────────────────────────────────────
function CompanyGroup({ company, entries }) {
  const colors = companyColor(company);
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: colors.border }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: colors.light }}>
        <span className="h-3 w-3 rounded-full" style={{ background: colors.primary }} />
        <span className="font-bold text-sm" style={{ color: colors.text }}>{company}</span>
        <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: colors.primary + '22', color: colors.text }}>
          {entries.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3 bg-gray-50">
        {entries.map(e => <ExcursionCard key={e.id} entry={e} />)}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function Excursions() {
  const { data: entries = [], isLoading } = useExcursions();
  const [addOpen, setAddOpen]             = useState(false);
  const [filter, setFilter]               = useState(null); // null = all

  // Collect all unique companies from data + known list for filter bar
  const companies = [...new Set([...entries.map(e => e.company)])].sort();

  const visible = filter ? entries.filter(e => e.company === filter) : entries;

  // Group by company
  const groups = {};
  for (const e of visible) {
    if (!groups[e.company]) groups[e.company] = [];
    groups[e.company].push(e);
  }

  return (
    <>
      <div className="flex flex-col min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div>
            <h1 className="text-lg font-bold text-white">Excursions</h1>
            <p className="text-xs text-gray-400">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-colors"
            style={{ background: '#546E7A' }}
          >
            <Plus size={16} /> Add entry
          </button>
        </div>

        {/* Company filter bar */}
        {companies.length > 1 && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilter(null)}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={filter === null
                ? { background: '#546E7A', color: '#fff' }
                : { background: '#374151', color: '#9CA3AF' }}
            >
              All
            </button>
            {companies.map(c => {
              const col = companyColor(c);
              return (
                <button
                  key={c}
                  onClick={() => setFilter(filter === c ? null : c)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={filter === c
                    ? { background: col.primary, color: '#fff' }
                    : { background: col.light,   color: col.text, border: `1px solid ${col.border}` }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4 px-4">
          {isLoading && (
            <>
              <div className="h-36 animate-pulse rounded-2xl bg-gray-800" />
              <div className="h-36 animate-pulse rounded-2xl bg-gray-800" />
            </>
          )}

          {!isLoading && Object.keys(groups).length === 0 && (
            <div className="rounded-2xl border border-gray-700 px-4 py-12 text-center">
              <p className="text-sm text-gray-500">No entries yet</p>
              <button
                onClick={() => setAddOpen(true)}
                className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: '#546E7A' }}
              >
                Add first entry
              </button>
            </div>
          )}

          {!isLoading && Object.keys(groups).sort().map(company => (
            <CompanyGroup key={company} company={company} entries={groups[company]} />
          ))}
        </div>
      </div>

      {addOpen && <AddForm onClose={() => setAddOpen(false)} />}
    </>
  );
}
