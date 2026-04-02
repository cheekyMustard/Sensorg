import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import NoteCard from '../NoteCard/NoteCard.jsx';
import { NOTE_CATEGORIES, categoryMeta } from '../../utils/noteCategories.js';

export default function NotesSection({ notes = [], loading, error, isOpen, onToggle, onAdd }) {
  const [activeFilter, setFilter] = useState(null);

  const visible = activeFilter ? notes.filter(n => n.category === activeFilter) : notes;

  // Only show filter pills for categories that actually exist in the current note list
  const presentCategories = NOTE_CATEGORIES.filter(c => notes.some(n => n.category === c.value));

  return (
    <section className="mt-3">
      <div
        onClick={onToggle}
        aria-expanded={isOpen}
        role="button"
        className="flex w-full items-center justify-between px-4 py-3.5 transition-all cursor-pointer"
        style={{
          background: 'var(--brand-gold)',
          borderRadius: isOpen ? '0.75rem 0.75rem 0 0' : '0.75rem',
          boxShadow: isOpen ? 'none' : '0 3px 10px rgba(212,165,116,0.4)',
        }}
      >
        <div className="flex flex-1 items-center gap-2">
          <span className="text-base font-bold tracking-tight" style={{ color: '#1A1A1A' }}>
            Notes
            {notes.length > 0 && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'rgba(0,0,0,0.12)', color: '#1A1A1A' }}>
                {notes.length}
              </span>
            )}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onAdd(); }}
            aria-label="Add note"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(0,0,0,0.12)' }}
          >
            <Plus size={16} style={{ color: '#1A1A1A' }} />
          </button>
        </div>
        <div className="flex min-h-[48px] min-w-[48px] items-center justify-center -mr-2">
          <ChevronDown
            size={18}
            style={{ color: '#1A1A1A', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2 rounded-b-xl p-3" style={{ background: '#323232' }}>
          {/* Category filter pills */}
          {presentCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setFilter(null)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors"
                style={activeFilter === null
                  ? { background: '#D4A574', color: '#1A1A1A' }
                  : { background: '#2A2A2A', color: '#9CA3AF', border: '1px solid #3A3A3A' }}
              >
                All
              </button>
              {presentCategories.map(c => {
                const active = activeFilter === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setFilter(active ? null : c.value)}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors"
                    style={active
                      ? { background: c.bg, color: c.color }
                      : { background: '#2A2A2A', color: '#9CA3AF', border: '1px solid #3A3A3A' }}
                  >
                    {c.icon} {c.label}
                  </button>
                );
              })}
            </div>
          )}

          {loading && (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => (
                <div key={i} className="h-20 animate-pulse rounded-xl" style={{ background: '#3a3a3a' }} />
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
              Failed to load notes: {error.message}
            </p>
          )}

          {!loading && !error && visible.length === 0 && (
            <p className="rounded-xl px-4 py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {activeFilter ? `No "${categoryMeta(activeFilter)?.label}" notes yet` : 'No notes yet'}
            </p>
          )}

          {!loading && !error && visible.map(n => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </section>
  );
}
