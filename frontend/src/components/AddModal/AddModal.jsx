import { useState, useEffect } from 'react';
import { X, Bike, StickyNote, ListChecks, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCreateRequest, useShops } from '../../hooks/useRequests.js';
import { SHOP_META } from '../../utils/shopColors.js';
import { useCreateNote } from '../../hooks/useNotes.js';
import { useCreateTask } from '../../hooks/useTasks.js';
import { useCreateKb } from '../../hooks/useKb.js';
import BikeTagsInput from '../BikeTagsInput/BikeTagsInput.jsx';
import ImageUploader from '../ImageUploader/ImageUploader.jsx';

const inputCls = 'rounded-lg border px-3 py-2 text-sm outline-none transition-shadow w-full';
const inputStyle = { borderColor: 'var(--brand-border)' };
function onFocus(e) { e.target.style.boxShadow = '0 0 0 2px var(--brand)'; }
function onBlur(e)  { e.target.style.boxShadow = 'none'; }

function Label({ children }) {
  return <label className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>{children}</label>;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function DeliveryForm({ onClose }) {
  const { user, activeShop } = useAuth();
  const { data: shops = [] } = useShops();
  const createMutation = useCreateRequest();

  const [form, setForm] = useState({
    from_shop_id: activeShop?.id ?? user?.shop_id ?? '',
    to_shop_id:   '',
    reason:       'rental',
    date_rental:  todayISO(),
    bikes:        [],
    note:         '',
  });

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    await createMutation.mutateAsync({
      from_shop_id: form.from_shop_id,
      to_shop_id:   form.to_shop_id,
      reason:       form.reason,
      date_rental:  form.date_rental,
      bikes:        form.bikes,
      note:         form.note || undefined,
    });
    onClose();
  }

  const otherShops = shops.filter(s => s.id !== form.from_shop_id);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label>From</Label>
        <select value={form.from_shop_id} onChange={e => set('from_shop_id', e.target.value)} required
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
          <option value="">Select shop…</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label>To</Label>
        <select value={form.to_shop_id} onChange={e => set('to_shop_id', e.target.value)} required
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
          <option value="">Select shop…</option>
          {otherShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Reason</Label>
        <select value={form.reason} onChange={e => set('reason', e.target.value)}
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
          <option value="rental">Rental</option>
          <option value="repair">Repair</option>
          <option value="return">Return</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Date</Label>
        <input type="date" value={form.date_rental} onChange={e => set('date_rental', e.target.value)} required
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Bikes</Label>
        <BikeTagsInput value={form.bikes} onChange={bikes => set('bikes', bikes)} shopId={form.from_shop_id || null} />
        <p className="text-xs text-stone-400">Enter or comma to add. Unknown labels are created automatically.</p>
      </div>

      <div className="flex flex-col gap-1">
        <Label>
          {form.reason === 'repair' ? 'Problem description' : 'Note'}
          {form.reason !== 'repair' && <span className="font-normal text-stone-400"> (optional)</span>}
        </Label>
        <textarea value={form.note} onChange={e => set('note', e.target.value)}
          required={form.reason === 'repair'}
          rows={2}
          placeholder={form.reason === 'repair' ? 'Describe the problem…' : 'Any extra info for this delivery…'}
          className={`${inputCls} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>

      {createMutation.error && (
        <p className="text-xs text-red-600">{createMutation.error.message}</p>
      )}

      <button type="submit"
        disabled={createMutation.isPending || !form.from_shop_id || !form.to_shop_id}
        className="mt-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ background: 'var(--brand)' }}
        onMouseEnter={e => { if (!createMutation.isPending) e.currentTarget.style.background = 'var(--brand-dark)'; }}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
      >
        {createMutation.isPending ? 'Creating…' : 'Create delivery'}
      </button>
    </form>
  );
}

function NoteForm({ onClose }) {
  const { user, activeShop, hasRole } = useAuth();
  const { data: shops = [] } = useShops();
  const createMutation = useCreateNote();
  const [form, setForm] = useState({ title: '', content: '', shop_id: activeShop?.id ?? '' });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    await createMutation.mutateAsync({ title: form.title, content: form.content, shop_id: form.shop_id || null });
    onClose();
  }

  const canPickShop = hasRole('admin', 'organiser');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label>Shop</Label>
        {canPickShop ? (
          <select value={form.shop_id} onChange={e => set('shop_id', e.target.value)}
            className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
            <option value="">Global (all shops)</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        ) : (
          <input
            readOnly
            value={shops.find(s => s.id === form.shop_id)?.name ?? activeShop?.name ?? '—'}
            className={`${inputCls} bg-gray-50 text-stone-500 cursor-default`}
            style={inputStyle}
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label>Title</Label>
        <input value={form.title} onChange={e => set('title', e.target.value)} required
          placeholder="Note title…"
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Content</Label>
        <textarea value={form.content} onChange={e => set('content', e.target.value)}
          rows={4} placeholder="Write something…"
          className={`${inputCls} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>

      {createMutation.error && (
        <p className="text-xs text-red-600">{createMutation.error.message}</p>
      )}

      <button type="submit" disabled={createMutation.isPending}
        className="mt-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ background: 'var(--brand)' }}
        onMouseEnter={e => { if (!createMutation.isPending) e.currentTarget.style.background = 'var(--brand-dark)'; }}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
      >
        {createMutation.isPending ? 'Creating…' : 'Create note'}
      </button>
    </form>
  );
}

const RECURRENCE_OPTIONS = [
  { value: 'day:1',   label: 'Every day' },
  { value: 'day:2',   label: 'Every 2 days' },
  { value: 'day:3',   label: 'Every 3 days' },
  { value: 'day:4',   label: 'Every 4 days' },
  { value: 'day:5',   label: 'Every 5 days' },
  { value: 'day:6',   label: 'Every 6 days' },
  { value: 'week:1',  label: 'Every week' },
  { value: 'month:1', label: 'Every month' },
];

function parseRecurrence(value) {
  const [unit, interval] = value.split(':');
  return { recurrence_unit: unit, recurrence_interval: Number(interval) };
}

function TaskForm({ onClose }) {
  const { activeShop } = useAuth();
  const createMutation = useCreateTask();

  // selectedShopIds: array of selected shop IDs; empty = "All shops"
  const [selectedShopIds, setSelectedShopIds] = useState(
    activeShop?.id ? [activeShop.id] : []
  );
  const [form, setForm] = useState({ title: '', description: '', recurrence: 'day:1' });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleShop(id) {
    setSelectedShopIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const allSelected = selectedShopIds.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    await createMutation.mutateAsync({
      title:       form.title,
      description: form.description,
      shop_ids:    selectedShopIds, // [] = global
      ...parseRecurrence(form.recurrence),
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label>Shops</Label>
        <div className="flex flex-col gap-1.5">
          {/* "All shops" toggle */}
          <button
            type="button"
            onClick={() => setSelectedShopIds([])}
            className="rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors"
            style={{
              background:   allSelected ? '#374151' : '#F9FAFB',
              borderColor:  allSelected ? '#374151' : '#D1D5DB',
              color:        allSelected ? '#fff'    : '#6B7280',
            }}
          >
            {allSelected ? '✓ ' : ''}All shops
          </button>
          {/* Per-shop toggle buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {SHOP_META.map(shop => {
              const on = selectedShopIds.includes(shop.id);
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => toggleShop(shop.id)}
                  style={{
                    background:   on ? shop.primary : shop.light,
                    border:       `2px solid ${on ? shop.dark : shop.border}`,
                    color:        on ? '#fff' : shop.text,
                    borderRadius: '0.5rem',
                    padding:      '0.5rem 0.25rem',
                    fontWeight:   600,
                    fontSize:     '0.8rem',
                    transition:   'all 0.1s',
                  }}
                >
                  {on ? '✓ ' : ''}{shop.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Title</Label>
        <input value={form.title} onChange={e => set('title', e.target.value)} required
          placeholder="What needs to be done?"
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Description <span className="font-normal text-stone-400">(optional)</span></Label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={3} placeholder="More details…"
          className={`${inputCls} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Recurrence</Label>
        <select value={form.recurrence} onChange={e => set('recurrence', e.target.value)}
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
          {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {createMutation.error && (
        <p className="text-xs text-red-600">{createMutation.error.message}</p>
      )}

      <button type="submit" disabled={createMutation.isPending}
        className="mt-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ background: 'var(--brand)' }}
        onMouseEnter={e => { if (!createMutation.isPending) e.currentTarget.style.background = 'var(--brand-dark)'; }}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
      >
        {createMutation.isPending ? 'Creating…' : 'Create task'}
      </button>
    </form>
  );
}

function KbForm({ onClose }) {
  const createMutation = useCreateKb();
  const [form, setForm] = useState({ title: '', content: '', category: '', image_url: null });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    await createMutation.mutateAsync({
      title:     form.title,
      content:   form.content,
      category:  form.category || null,
      image_url: form.image_url || null,
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label>Title</Label>
        <input value={form.title} onChange={e => set('title', e.target.value)} required
          placeholder="Article title…"
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Category <span className="font-normal text-stone-400">(optional)</span></Label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
          <option value="">— No category —</option>
          <option value="BRM">BRM (Bike Rental Manager)</option>
          <option value="Bikes">Bikes</option>
          <option value="Shop">Shop</option>
          <option value="General">General</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Content <span className="font-normal text-stone-400">(optional)</span></Label>
        <textarea value={form.content} onChange={e => set('content', e.target.value)}
          rows={4} placeholder="Write the article content…"
          className={`${inputCls} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <ImageUploader value={form.image_url} onChange={url => set('image_url', url)} />

      {createMutation.error && (
        <p className="text-xs text-red-600">{createMutation.error.message}</p>
      )}

      <button type="submit" disabled={createMutation.isPending}
        className="mt-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ background: 'var(--brand)' }}
        onMouseEnter={e => { if (!createMutation.isPending) e.currentTarget.style.background = 'var(--brand-dark)'; }}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
      >
        {createMutation.isPending ? 'Creating…' : 'Create article'}
      </button>
    </form>
  );
}

// roles: null = all non-cleaner; otherwise array of allowed roles
const ALL_MODES = [
  { id: 'delivery', label: 'Bike Delivery', icon: Bike,       color: 'var(--brand)',      roles: null },
  { id: 'note',     label: 'Note',          icon: StickyNote, color: 'var(--brand-gold)',  roles: null },
  { id: 'task',     label: 'Task',          icon: ListChecks, color: 'var(--brand-green)', roles: ['admin', 'organiser', 'general'] },
  { id: 'kb',       label: 'Knowledge Base', icon: BookOpen,  color: 'var(--brand-blue)',  roles: ['admin', 'organiser', 'mechanic'] },
];

const TITLES = { delivery: 'New Bike Delivery', note: 'New Note', task: 'New Task', kb: 'New Article' };

export default function AddModal({ open, onClose, initialMode = null }) {
  const { user, hasRole } = useAuth();
  const [mode, setMode] = useState(null);

  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);

  if (!open) return null;

  // Cleaner can't create deliveries or notes either
  const isCleanerOnly = user?.roles?.length === 1 && user.roles[0] === 'cleaner';
  const modes = ALL_MODES.filter(m => {
    if (isCleanerOnly) return false;
    if (!m.roles) return true;
    return m.roles.some(r => user?.roles?.includes(r));
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white px-5 pb-8 pt-5 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ borderTop: '3px solid var(--brand)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: 'var(--charcoal)' }}>
            {mode ? TITLES[mode] : 'Add new…'}
          </h2>
          <button onClick={mode && !initialMode ? () => setMode(null) : onClose} aria-label="Back / Close"
            className="rounded-lg p-1 transition-colors hover:bg-orange-50" style={{ color: 'var(--charcoal)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Mode picker */}
        {!mode && (
          <div className="flex flex-col gap-2">
            {modes.map(({ id, label, icon: Icon, color }) => (
              <button key={id} onClick={() => setMode(id)}
                className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-orange-50"
                style={{ borderColor: 'var(--brand-border)', color: 'var(--charcoal)' }}>
                <Icon size={18} style={{ color }} />
                {label}
              </button>
            ))}
          </div>
        )}

        {mode === 'delivery' && <DeliveryForm onClose={onClose} />}
        {mode === 'note'     && <NoteForm     onClose={onClose} />}
        {mode === 'task'     && <TaskForm     onClose={onClose} />}
        {mode === 'kb'       && <KbForm       onClose={onClose} />}
      </div>
    </div>
  );
}
