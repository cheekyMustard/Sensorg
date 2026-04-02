import { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useArchive } from '../../hooks/useNotes.js';

import { formatDateTime as formatDate } from '../../utils/formatDate.js';

function Section({ title, count, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        style={{ background: color + '28' }}
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
  const bikes = r.bikes ?? [];
  return (
    <div className="px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-700">
          {r.from_shop_name} → {r.to_shop_name}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          r.status === 'done'
            ? 'bg-green-100 text-green-800'
            : r.status === 'cancelled'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-400'
        }`}>
          {r.status}
        </span>
      </div>
      {r.reason && <p className="mt-0.5 text-xs text-gray-500">{r.reason}</p>}
      {bikes.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {bikes.map(b => (
            <span key={b.id ?? b.label} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
              {b.label}
            </span>
          ))}
        </div>
      )}
      <p className="mt-0.5 text-xs text-gray-400">
        {r.author ? `by ${r.author} · ` : ''}{formatDate(r.updated_at)}
      </p>
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
      {t.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 whitespace-normal">{t.description}</p>}
      <p className="mt-0.5 text-xs text-gray-400">
        {t.author ? `by ${t.author} · ` : ''}completed {formatDate(t.updated_at)}
      </p>
    </div>
  );
}

function RepairRow({ r }) {
  const bikes = r.bike_labels ?? [];
  return (
    <div className="px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-700">
          {bikes.length > 0 ? bikes.join(', ') : '—'}
        </span>
        {r.shop_name && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{r.shop_name}</span>
        )}
      </div>
      {r.problem_description && (
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 italic">{r.problem_description}</p>
      )}
      <p className="mt-0.5 text-xs text-gray-400">
        {r.taken_by_username ? `by ${r.taken_by_username} · ` : ''}
        arrived {formatDate(r.arrival_date)} · done {formatDate(r.done_at)}
      </p>
    </div>
  );
}

function matchesSearch(query, ...fields) {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some(f => f && String(f).toLowerCase().includes(q));
}

export default function ArchivePanel() {
  const { data, isLoading } = useArchive();
  const [search, setSearch] = useState('');

  const requests       = useMemo(() => {
    const all = data?.requests ?? [];
    if (!search) return all;
    return all.filter(r =>
      matchesSearch(search, r.from_shop_name, r.to_shop_name, r.reason, r.author,
        ...(r.bikes?.map(b => b.label) ?? []))
    );
  }, [data, search]);

  const repairRequests = useMemo(() => {
    const all = data?.repair_requests ?? [];
    if (!search) return all;
    return all.filter(r =>
      matchesSearch(search, r.shop_name, r.problem_description, r.taken_by_username,
        ...(r.bike_labels ?? []))
    );
  }, [data, search]);

  const notes = useMemo(() => {
    const all = data?.notes ?? [];
    if (!search) return all;
    return all.filter(n => matchesSearch(search, n.title, n.content, n.author, n.shop_name));
  }, [data, search]);

  const tasks = useMemo(() => {
    const all = data?.tasks ?? [];
    if (!search) return all;
    return all.filter(t => matchesSearch(search, t.title, t.description, t.author, t.shop_name));
  }, [data, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search archive…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <Section title="Deliveries" count={requests.length} color="#E8772A" defaultOpen>
        {requests.length === 0
          ? <p className="px-4 py-6 text-center text-sm text-gray-400">No archived deliveries</p>
          : requests.map(r => <DeliveryRow key={r.id} r={r} />)
        }
      </Section>

      <Section title="Repair Requests" count={repairRequests.length} color="#B71C1C">
        {repairRequests.length === 0
          ? <p className="px-4 py-6 text-center text-sm text-gray-400">No archived repair requests</p>
          : repairRequests.map(r => <RepairRow key={r.id} r={r} />)
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
