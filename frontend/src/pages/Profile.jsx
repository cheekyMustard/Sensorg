import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { usePush } from '../hooks/usePush.js';
import { useRequests, useBrmToggle } from '../hooks/useRequests.js';
import { useUsers } from '../hooks/useUsers.js';
import { Bell, BellOff, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { SHOP_META } from '../utils/shopColors.js';

import { formatDate } from '../utils/formatDate.js';

function JobTodoRow({ job }) {
  const toggle = useBrmToggle();

  function handleToggle() {
    toggle.mutate({ id: job.id, brm_blocked: !job.brm_blocked, version: job.version });
  }

  const Icon = job.brm_blocked ? CheckSquare : Square;

  return (
    <div className={`rounded-xl border p-3 transition-colors ${job.brm_blocked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
      {/* Route + date */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">
          {job.from_shop_name} → {job.to_shop_name}
        </p>
        <span className="shrink-0 text-xs text-gray-400">{formatDate(job.date_rental)}</span>
      </div>

      {/* Bike labels */}
      {job.bikes?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {job.bikes.map(b => (
            <span key={b.id} className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* BRM checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggle.isPending}
        className={`mt-2.5 flex items-center gap-2 text-sm font-medium disabled:opacity-50 transition-colors ${
          job.brm_blocked ? 'text-green-700' : 'text-gray-600'
        }`}
      >
        <Icon size={18} className={job.brm_blocked ? 'text-green-600' : 'text-gray-400'} />
        Block transport in BRM?
      </button>
    </div>
  );
}

function MyJobsTodo({ userId }) {
  const { requests, isLoading } = useRequests('in_progress');
  const myJobs = requests.filter(r => r.updated_by_user_id === userId);

  if (isLoading || myJobs.length === 0) return null;

  const doneCount = myJobs.filter(j => j.brm_blocked).length;

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">My active jobs</h3>
        <span className="text-xs text-gray-400">{doneCount}/{myJobs.length} blocked</span>
      </div>
      <div className="flex flex-col gap-2">
        {myJobs.map(job => <JobTodoRow key={job.id} job={job} />)}
      </div>
    </div>
  );
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function TeamOverview() {
  const { data: users = [], isLoading } = useUsers();

  const groups = SHOP_META.map(shop => ({
    shop,
    members: users.filter(u => u.active_shop_name === shop.name),
  }));
  const unassigned = users.filter(u => !u.active_shop_name);
  const total = users.length;

  if (isLoading) return <div className="h-24 animate-pulse rounded-xl bg-gray-100 mt-6" />;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Who's working today</h3>
        <span className="text-xs text-gray-400">{total} {total === 1 ? 'person' : 'people'} logged in</span>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
          Nobody has logged in today yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map(({ shop, members }) => members.length === 0 ? null : (
            <div key={shop.id} className="overflow-hidden rounded-xl" style={{ border: `1px solid ${shop.border}` }}>
              <div className="flex items-center justify-between px-3 py-2" style={{ background: shop.primary }}>
                <span className="text-xs font-bold text-white">{shop.name}</span>
                <span className="text-xs text-white" style={{ opacity: 0.8 }}>
                  {members.length} {members.length === 1 ? 'person' : 'people'}
                </span>
              </div>
              <div className="divide-y" style={{ background: shop.light, borderColor: shop.border }}>
                {members.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <span className="text-sm font-medium" style={{ color: shop.text }}>{u.username}</span>
                      <span className="ml-2 rounded-full px-3 py-0.5 font-semibold" style={{ background: shop.border, color: shop.text, fontSize: 13 }}>{(u.roles ?? []).join(', ')}</span>
                    </div>
                    <span className="text-xs text-gray-400">since {formatTime(u.last_seen_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {unassigned.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="flex items-center justify-between bg-gray-500 px-3 py-2">
                <span className="text-xs font-bold text-white">No shop selected</span>
                <span className="text-xs text-white" style={{ opacity: 0.8 }}>{unassigned.length}</span>
              </div>
              <div className="divide-y divide-gray-100 bg-gray-50">
                {unassigned.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{u.username}</span>
                      <span className="ml-2 rounded-full bg-gray-200 px-3 py-0.5 font-semibold text-gray-600" style={{ fontSize: 13 }}>{(u.roles ?? []).join(', ')}</span>
                    </div>
                    <span className="text-xs text-gray-400">since {formatTime(u.last_seen_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePush();

  return (
    <main className="flex-1 px-4 py-4 pb-(--bottom-nav-height)">
      <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
      <p className="mt-1 text-sm text-gray-500">{user?.username} · {(user?.roles ?? []).join(', ')}</p>

      {/* Active jobs to-do */}
      <MyJobsTodo userId={user?.id} />

      {/* Team overview */}
      <TeamOverview />

      {/* Settings section */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Settings</h3>
        <div className="flex flex-col gap-2">
          {/* Push notifications */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-800">Push notifications</p>

            {!supported && (
              <p className="mt-1 text-xs text-gray-400">Not supported by this browser.</p>
            )}

            {supported && permission === 'denied' && (
              <p className="mt-1 text-xs text-red-500">
                Notifications are blocked. Allow them in your browser settings.
              </p>
            )}

            {supported && permission !== 'denied' && (
              <>
                <p className="mt-1 text-xs text-gray-500">
                  {subscribed
                    ? 'You will be notified when a delivery arrives at your shop.'
                    : 'Get notified when a delivery arrives at your shop.'}
                </p>
                <button
                  onClick={subscribed ? unsubscribe : subscribe}
                  disabled={loading}
                  className={`mt-3 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors ${
                    subscribed
                      ? 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {subscribed ? <BellOff size={15} /> : <Bell size={15} />}
                  {loading ? 'Please wait…' : subscribed ? 'Disable notifications' : 'Enable notifications'}
                </button>
              </>
            )}
          </div>

          {user?.roles?.includes('admin') && (
            <Link
              to="/admin"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <ShieldCheck size={16} className="text-blue-600" />
              Admin panel
            </Link>
          )}
        </div>
      </div>

    </main>
  );
}
