import { useState } from 'react';
import { Users, Store, Bike, Archive } from 'lucide-react';
import UsersPanel from './UsersPanel.jsx';
import ShopsPanel from './ShopsPanel.jsx';
import BikesPanel from './BikesPanel.jsx';
import ArchivePanel from './ArchivePanel.jsx';

const TABS = [
  { id: 'users',   label: 'Users',   icon: Users   },
  { id: 'shops',   label: 'Shops',   icon: Store   },
  { id: 'bikes',   label: 'Bikes',   icon: Bike    },
  { id: 'archive', label: 'Archive', icon: Archive },
];

export default function AdminPage() {
  const [tab, setTab] = useState('users');

  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 pb-(--bottom-nav-height)">
      <h1 className="text-lg font-semibold text-gray-800">Admin</h1>

      {/* Tab bar */}
      <div className="mt-3 flex rounded-xl border border-gray-200 bg-white overflow-hidden">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'users'   && <UsersPanel />}
        {tab === 'shops'   && <ShopsPanel />}
        {tab === 'bikes'   && <BikesPanel />}
        {tab === 'archive' && <ArchivePanel />}
      </div>
    </main>
  );
}
