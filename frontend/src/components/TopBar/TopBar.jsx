import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getShopMeta } from '../../utils/shopColors.js';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { LogOut, Home, Bike, Map, User, MapPin } from 'lucide-react';
import { useExcursions } from '../../hooks/useExcursions.js';
import { loadSeen } from '../../utils/seenStorage.js';
import { EXCURSIONS_SEEN_KEY } from '../../pages/Excursions.jsx';

export default function TopBar() {
  const { user, activeShop, logout } = useAuth();
  const shopMeta  = activeShop ? getShopMeta(activeShop.name) : null;
  const navigate  = useNavigate();
  const location  = useLocation();
  const { data: excursions = [] }  = useExcursions();
  const [excSeen, setExcSeen]      = useState(() => loadSeen(EXCURSIONS_SEEN_KEY));

  useEffect(() => {
    setExcSeen(loadSeen(EXCURSIONS_SEEN_KEY));
  }, [location.pathname]);

  const unseenExcursions = excursions.filter(e => !excSeen.has(e.id)).length;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between px-4"
      style={{ background: 'var(--charcoal)', borderBottom: '1px solid #3D3D3D' }}
    >
      {/* Shop badge */}
      {shopMeta ? (
        <span
          className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-bold"
          style={{ background: shopMeta.primary, color: '#fff' }}
        >
          <MapPin size={13} />
          {activeShop.name}
        </span>
      ) : (
        <span className="text-sm text-gray-500">—</span>
      )}

      {/* Desktop nav links — hidden on mobile (BottomNav handles those) */}
      <nav className="hidden md:flex items-center gap-1">
        {[
          { to: '/',           end: true,  icon: <Home size={16} />,  label: 'Home'       },
          { to: '/bikes',      end: false, icon: <Bike size={16} />,  label: 'Bikes'      },
          { to: '/excursions', end: false, icon: <Map  size={16} />,  label: 'Excursions', badge: unseenExcursions },
          { to: '/profile',    end: false, icon: <User size={16} />,  label: 'Profile'    },
        ].map(({ to, end, icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`
            }
            style={({ isActive }) => isActive ? { color: 'var(--brand)' } : {}}
          >
            <div className="relative">
              {icon}
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{user.username}</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              background: shopMeta ? shopMeta.primary : '#555',
              color: '#fff',
              opacity: 0.85,
            }}
          >
            {(user.roles ?? []).join(', ')}
          </span>
          <button
            onClick={handleLogout}
            className="ml-1 rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
