import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, Bike, Map } from 'lucide-react';
import { useExcursions } from '../../hooks/useExcursions.js';
import { loadSeen } from '../../utils/seenStorage.js';
import { EXCURSIONS_SEEN_KEY } from '../../pages/Excursions.jsx';

export default function BottomNav() {
  const location                        = useLocation();
  const { data: excursions = [] }       = useExcursions();
  const [excSeen, setExcSeen]           = useState(() => loadSeen(EXCURSIONS_SEEN_KEY));

  // Re-read after navigating away from the Excursions page (which marks entries seen)
  useEffect(() => {
    setExcSeen(loadSeen(EXCURSIONS_SEEN_KEY));
  }, [location.pathname]);

  const unseenExcursions = excursions.filter(e => !excSeen.has(e.id)).length;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t md:hidden"
      style={{ background: 'var(--charcoal)', borderColor: '#3D3D3D', zIndex: 50 }}
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-6 text-xs transition-colors ${isActive ? '' : 'opacity-50'}`
        }
        style={({ isActive }) => ({ color: isActive ? 'var(--brand)' : '#FFFFFF' })}
      >
        <Home size={22} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/bikes"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-6 text-xs transition-colors ${isActive ? '' : 'opacity-50'}`
        }
        style={({ isActive }) => ({ color: isActive ? 'var(--brand)' : '#FFFFFF' })}
      >
        <Bike size={22} />
        <span>Bikes</span>
      </NavLink>

      <NavLink
        to="/excursions"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-6 text-xs transition-colors ${isActive ? '' : 'opacity-50'}`
        }
        style={({ isActive }) => ({ color: isActive ? 'var(--brand)' : '#FFFFFF' })}
      >
        <div className="relative">
          <Map size={22} />
          {unseenExcursions > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unseenExcursions > 9 ? '9+' : unseenExcursions}
            </span>
          )}
        </div>
        <span>Excursions</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-6 text-xs transition-colors ${isActive ? '' : 'opacity-50'}`
        }
        style={({ isActive }) => ({ color: isActive ? 'var(--brand)' : '#FFFFFF' })}
      >
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
