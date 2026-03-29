import { useState, useMemo } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import KbCard from '../KbCard/KbCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function KbSection({ articles = [], loading, error, isOpen, onToggle, onAdd }) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = useMemo(() => {
    const cats = [...new Set(articles.map(a => a.category).filter(Boolean))].sort();
    return cats;
  }, [articles]);

  const filtered = activeCategory
    ? articles.filter(a => a.category === activeCategory)
    : articles;

  return (
    <section className="mt-3">
      <div
        onClick={onToggle}
        aria-expanded={isOpen}
        role="button"
        className="flex w-full items-center justify-between px-4 py-3.5 transition-all cursor-pointer"
        style={{
          background: 'var(--brand-blue)',
          borderRadius: isOpen ? '0.75rem 0.75rem 0 0' : '0.75rem',
          boxShadow: isOpen ? 'none' : '0 3px 10px rgba(74,144,164,0.4)',
        }}
      >
        <div className="flex flex-1 items-center gap-2">
          <span className="text-base font-bold tracking-tight text-white">
            Nice to know
            {articles.length > 0 && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
                {articles.length}
              </span>
            )}
          </span>
          {user?.roles?.some(r => ['admin', 'organiser', 'mechanic'].includes(r)) && (
            <button
              onClick={e => { e.stopPropagation(); onAdd(); }}
              aria-label="Add article"
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <Plus size={16} className="text-white" />
            </button>
          )}
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
                <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: '#3a3a3a' }} />
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
              Failed to load articles: {error.message}
            </p>
          )}

          {!loading && !error && (
            <>
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2 px-1">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    style={
                      activeCategory === null
                        ? { background: 'var(--brand-blue)', color: '#fff' }
                        : { background: 'rgba(74,144,164,0.18)', color: 'rgba(255,255,255,0.65)' }
                    }
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button key={cat}
                      onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                      style={
                        activeCategory === cat
                          ? { background: 'var(--brand-blue)', color: '#fff' }
                          : { background: 'rgba(74,144,164,0.18)', color: 'rgba(255,255,255,0.65)' }
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {filtered.length === 0 && (
                <p className="rounded-xl px-4 py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {articles.length === 0 ? 'No articles yet' : 'No articles in this category'}
                </p>
              )}

              {filtered.map(a => <KbCard key={a.id} article={a} />)}
            </>
          )}
        </div>
      )}
    </section>
  );
}
