import { ChevronDown, Plus } from 'lucide-react';
import TaskCard from '../TaskCard/TaskCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TasksSection({ tasks = [], loading, error, isOpen, onToggle, onAdd }) {
  const { user } = useAuth();
  const done    = tasks.filter(t => t.completion_id);
  const pending = tasks.filter(t => !t.completion_id);
  const allDone = tasks.length > 0 && pending.length === 0;

  return (
    <section className="mt-3">
      <div
        onClick={onToggle}
        aria-expanded={isOpen}
        role="button"
        className="flex w-full items-center justify-between px-4 py-3.5 transition-all cursor-pointer"
        style={{
          background: 'var(--brand-green)',
          borderRadius: isOpen ? '0.75rem 0.75rem 0 0' : '0.75rem',
          boxShadow: isOpen ? 'none' : '0 3px 10px rgba(91,168,92,0.4)',
        }}
      >
        <div className="flex flex-1 items-center gap-2">
          <span className="text-base font-bold tracking-tight text-white">
            Checklist
            {tasks.length > 0 && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold" style={{
                background: allDone ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.22)',
                color: '#fff',
              }}>
                {done.length}/{tasks.length}
              </span>
            )}
          </span>
          {user?.roles?.some(r => ['admin', 'organiser', 'general'].includes(r)) && (
            <button
              onClick={e => { e.stopPropagation(); onAdd(); }}
              aria-label="Add task"
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
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: '#3a3a3a' }} />
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
              Failed to load tasks: {error.message}
            </p>
          )}

          {!loading && !error && tasks.length === 0 && (
            <p className="rounded-xl px-4 py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              No tasks yet
            </p>
          )}

          {!loading && !error && [
            ...pending,
            ...done,
          ].map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      )}
    </section>
  );
}
