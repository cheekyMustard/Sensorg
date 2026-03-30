import { useState, useRef } from 'react';
import { ChevronDown, Plus, Smile, Trash2, X, Tag } from 'lucide-react';
import { useJokes, useJokeCategories, useCreateJoke, useDeleteJoke } from '../../hooks/useJokes.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ImageUploader from '../ImageUploader/ImageUploader.jsx';
import ImageLightbox from '../ImageLightbox/ImageLightbox.jsx';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Seen tracking via localStorage ─────────────────────────────────────────
function loadSeen() {
  try { return new Set(JSON.parse(localStorage.getItem('sensorg_jokes_seen') || '[]')); }
  catch { return new Set(); }
}
function saveSeen(set) {
  localStorage.setItem('sensorg_jokes_seen', JSON.stringify([...set]));
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function resolveImg(url) {
  if (!url) return null;
  return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function preview(text, chars = 110) {
  if (!text) return null;
  return text.length > chars ? text.slice(0, chars).trimEnd() + '…' : text;
}

// ── Add Form ────────────────────────────────────────────────────────────────
function AddJokeForm({ onClose }) {
  const { data: categories = [] } = useJokeCategories();
  const createMutation = useCreateJoke();

  const [content,   setContent]   = useState('');
  const [imageUrl,  setImageUrl]  = useState(null);
  const [category,  setCategory]  = useState('');
  const [error,     setError]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() && !imageUrl) {
      setError('Add some text or an image — or both!');
      return;
    }
    setError(null);
    await createMutation.mutateAsync({
      content:   content.trim() || undefined,
      image_url: imageUrl || undefined,
      category:  category.trim() || undefined,
    });
    onClose();
  }

  return (
    <div
      className="rounded-2xl border border-dashed border-yellow-400/50 bg-yellow-950/20 p-4 mb-3"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-yellow-300 flex items-center gap-1.5">
          <Smile size={15} /> Add a joke
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Text content */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          placeholder="Write your joke here… (optional if you have an image)"
          className="w-full rounded-xl border border-gray-600 bg-gray-900/60 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none resize-none transition-shadow focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        />

        {/* Image */}
        <ImageUploader value={imageUrl} onChange={url => setImageUrl(url)} label="Image (optional)" />

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
            <Tag size={11} /> Category <span className="font-normal text-gray-600">(optional)</span>
          </label>
          <input
            list="joke-categories-list"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Pick or type a category…"
            className="w-full rounded-xl border border-gray-600 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none transition-shadow focus:border-yellow-400/60"
          />
          <datalist id="joke-categories-list">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {createMutation.error && <p className="text-xs text-red-400">Failed to save — try again</p>}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-xl py-2.5 text-sm font-bold text-gray-900 transition-colors disabled:opacity-50"
          style={{ background: '#FCD34D' }}
        >
          {createMutation.isPending ? 'Posting…' : '😄 Post joke'}
        </button>
      </form>
    </div>
  );
}

// ── Single Joke Card ─────────────────────────────────────────────────────────
function JokeCard({ joke, seen, onSeen }) {
  const { user } = useAuth();
  const deleteMutation = useDeleteJoke();
  const [expanded,  setExpanded]  = useState(false);
  const [lightbox,  setLightbox]  = useState(false);
  const [imgError,  setImgError]  = useState(false);

  const imgSrc   = resolveImg(joke.image_url);
  const canDelete = user?.id === joke.created_by_user_id || user?.roles?.includes('admin');

  function handleClick() {
    if (!expanded) onSeen(joke.id);
    setExpanded(e => !e);
  }

  const cardBg    = seen ? '#1C1C1E' : '#2A2410';
  const borderCol = seen ? '#2D2D2D' : '#7C6A1A';

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 select-none"
        style={{
          background:  cardBg,
          border:      `1px solid ${borderCol}`,
          fontFamily:  "'Nunito', sans-serif",
        }}
        onClick={handleClick}
      >
        {/* ── Preview (collapsed) ── */}
        {!expanded && (
          <div className="flex items-center gap-3 px-3 py-3">
            {/* Tiny image thumbnail */}
            {imgSrc && !imgError && (
              <img
                src={imgSrc}
                alt=""
                className="shrink-0 rounded-xl object-cover"
                style={{ width: 52, height: 52 }}
                onError={() => setImgError(true)}
              />
            )}

            <div className="min-w-0 flex-1">
              {/* Text preview */}
              {joke.content ? (
                <p
                  className="text-sm leading-snug"
                  style={{ color: seen ? '#9CA3AF' : '#FDE68A' }}
                >
                  {preview(joke.content)}
                </p>
              ) : (
                <p className="text-sm italic" style={{ color: seen ? '#6B7280' : '#FCD34D' }}>
                  📷 Image joke
                </p>
              )}

              {/* Meta row */}
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {joke.category && (
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: seen ? '#2D2D2D' : '#3D3010', color: seen ? '#6B7280' : '#FCD34D' }}>
                    {joke.category}
                  </span>
                )}
                <span className="text-xs" style={{ color: seen ? '#4B5563' : '#9CA3AF' }}>
                  {joke.author ?? 'Anonymous'} · {formatDate(joke.created_at)}
                  {seen && <span className="ml-1 opacity-60">· seen</span>}
                </span>
              </div>
            </div>

            <ChevronDown
              size={16}
              className="shrink-0 text-gray-600"
              style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
          </div>
        )}

        {/* ── Expanded ── */}
        {expanded && (
          <div onClick={e => e.stopPropagation()}>
            {/* Full image */}
            {imgSrc && !imgError && (
              <div onClick={() => setLightbox(true)} className="cursor-zoom-in">
                <img
                  src={imgSrc}
                  alt=""
                  className="w-full object-contain"
                  style={{ maxHeight: 340, background: '#111' }}
                  onError={() => setImgError(true)}
                />
              </div>
            )}

            <div className="px-4 py-4">
              {/* Full text */}
              {joke.content && (
                <p
                  className="text-base leading-relaxed whitespace-pre-wrap"
                  style={{ color: '#FDE68A', fontFamily: "'Nunito', sans-serif", fontStyle: 'italic' }}
                >
                  {joke.content}
                </p>
              )}

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {joke.category && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{ background: '#3D3010', color: '#FCD34D' }}>
                      {joke.category}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    by {joke.author ?? 'Anonymous'} · {formatDate(joke.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canDelete && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteMutation.mutate(joke.id); }}
                      disabled={deleteMutation.isPending}
                      className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={handleClick}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {lightbox && imgSrc && (
        <ImageLightbox src={imgSrc} alt="joke image" onClose={() => setLightbox(false)} />
      )}
    </>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
export default function JokesSection({ isOpen, onToggle }) {
  const { data: jokes = [], isLoading } = useJokes();
  const [seen,       setSeen]       = useState(loadSeen);
  const [showAdd,    setShowAdd]    = useState(false);
  const [activeFilter, setFilter]   = useState(null);
  const { data: categories = [] }   = useJokeCategories();

  function markSeen(id) {
    setSeen(prev => {
      const next = new Set(prev);
      next.add(id);
      saveSeen(next);
      return next;
    });
  }

  const unseenCount = jokes.filter(j => !seen.has(j.id)).length;

  const visible = activeFilter
    ? jokes.filter(j => j.category === activeFilter)
    : jokes;

  return (
    <section className="mt-3 rounded-2xl overflow-hidden border border-gray-700">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3"
        style={{ background: '#1A1800' }}
      >
        <div className="flex items-center gap-2">
          <Smile size={16} style={{ color: '#FCD34D' }} />
          <span
            className="font-bold text-sm"
            style={{ color: '#FCD34D', fontFamily: "'Nunito', sans-serif" }}
          >
            Jokes
          </span>
          {unseenCount > 0 && (
            <span className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: '#FCD34D', color: '#1A1800' }}>
              {unseenCount} new
            </span>
          )}
          {unseenCount === 0 && jokes.length > 0 && (
            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
              {jokes.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); setShowAdd(v => !v); if (!isOpen) onToggle(); }}
            className="flex items-center justify-center rounded-lg p-1 transition-colors hover:bg-yellow-900/40"
            style={{ color: '#FCD34D' }}
            title="Add joke"
          >
            <Plus size={16} />
          </button>
          <ChevronDown
            size={16}
            style={{ color: '#FCD34D', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
          />
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="flex flex-col gap-2 px-3 py-3" style={{ background: '#111008' }}>
          {/* Add form */}
          {showAdd && <AddJokeForm onClose={() => setShowAdd(false)} />}

          {/* Category filter pills */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setFilter(null)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors"
                style={activeFilter === null
                  ? { background: '#FCD34D', color: '#1A1800' }
                  : { background: '#2A2410', color: '#9CA3AF', border: '1px solid #3D3010' }}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setFilter(activeFilter === c ? null : c)}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors"
                  style={activeFilter === c
                    ? { background: '#FCD34D', color: '#1A1800' }
                    : { background: '#2A2410', color: '#9CA3AF', border: '1px solid #3D3010' }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <>
              <div className="h-14 animate-pulse rounded-2xl" style={{ background: '#1C1C1E' }} />
              <div className="h-14 animate-pulse rounded-2xl" style={{ background: '#1C1C1E' }} />
              <div className="h-14 animate-pulse rounded-2xl" style={{ background: '#1C1C1E' }} />
            </>
          )}

          {/* Empty */}
          {!isLoading && visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-700 px-4 py-8 text-center"
                 style={{ fontFamily: "'Nunito', sans-serif" }}>
              <p className="text-2xl mb-2">😶</p>
              <p className="text-sm text-gray-500">
                {activeFilter ? `No jokes in "${activeFilter}" yet` : 'No jokes yet — be the first!'}
              </p>
            </div>
          )}

          {/* Jokes */}
          {!isLoading && visible.map(joke => (
            <JokeCard
              key={joke.id}
              joke={joke}
              seen={seen.has(joke.id)}
              onSeen={markSeen}
            />
          ))}
        </div>
      )}
    </section>
  );
}
