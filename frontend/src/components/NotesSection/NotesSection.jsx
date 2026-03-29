import { ChevronDown, Plus } from 'lucide-react';
import NoteCard from '../NoteCard/NoteCard.jsx';

export default function NotesSection({ notes = [], loading, error, isOpen, onToggle, onAdd }) {
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
          <span className="text-base font-bold tracking-tight text-white">
            Notes
            {notes.length > 0 && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
                {notes.length}
              </span>
            )}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onAdd(); }}
            aria-label="Add note"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <Plus size={16} className="text-white" />
          </button>
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
                <div key={i} className="h-20 animate-pulse rounded-xl" style={{ background: '#3a3a3a' }} />
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
              Failed to load notes: {error.message}
            </p>
          )}

          {!loading && !error && notes.length === 0 && (
            <p className="rounded-xl px-4 py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              No notes yet
            </p>
          )}

          {!loading && !error && notes.map(n => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </section>
  );
}
