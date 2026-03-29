import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useArchive } from '../../hooks/useNotes.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function Section({ title, count, color, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        style={{ background: color + '18' }}
      >
        <span className="font-semibold text-sm text-gray-800">
          {title}
          <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">{count}</span>
        </span>
        <ChevronDown size={16} className="text-gray-400"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && <div className="divide-y divide-gray-100">{children}</div>}
    </div>
  );
}

function DeliveryRow({ r }) {
  const bikes = r.bikes?.map(b => b.label).join(', ') || '—';
  return (
    <div className="px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-700">
          {r.from_shop_name} → {r.to_shop_name}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          r.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {r.status}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-gray-400">
        {r.reason} · {bikes}
      </p>
      <p className="mt-0.5 text-xs text-gray-400">{formatDate(r.updated_at)}</p>
    </div>
  );
}

function NoteRow({ n }) {
  return (
    <div className="px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-700">{n.title}</span>
        {n.shop_name && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{n.shop_name}</span>
        )}
      </div>
      {n.content && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.content}</p>}
      <p className="mt-0.5 text-xs text-gray-400">
        by {n.author ?? '—'} · done {formatDate(n.done_at)}
      </p>
    </div>
  );
}

function TaskRow({ t }) {
  return (
    <div className="px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-700">{t.title}</span>
        {t.shop_name && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{t.shop_name}</span>
        )}
      </div>
      {t.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{t.description}</p>}
      <p className="mt-0.5 text-xs text-gray-400">completed {formatDate(t.updated_at)}</p>
    </div>
  );
}

export default function ArchivePanel() {
  const { data, isLoading } = useArchive();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
      </div>
    );
  }

  const requests = data?.requests ?? [];
  const notes    = data?.notes    ?? [];
  const tasks    = data?.tasks    ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-400">
        History of completed deliveries, archived notes, and completed one-time tasks — newest first.
      </p>

      <Section title="Deliveries" count={requests.length} color="#E8772A">
        {requests.length === 0
          ? <p className="px-4 py-6 text-center text-sm text-gray-400">No archived deliveries</p>
          : requests.map(r => <DeliveryRow key={r.id} r={r} />)
        }
      </Section>

      <Section title="Notes" count={notes.length} color="#D4A574">
        {notes.length === 0
          ? <p className="px-4 py-6 text-center text-sm text-gray-400">No archived notes</p>
          : notes.map(n => <NoteRow key={n.id} n={n} />)
        }
      </Section>

      <Section title="Tasks" count={tasks.length} color="#5BA85C">
        {tasks.length === 0
          ? <p className="px-4 py-6 text-center text-sm text-gray-400">No completed one-time tasks</p>
          : tasks.map(t => <TaskRow key={t.id} t={t} />)
        }
      </Section>
    </div>
  );
}
