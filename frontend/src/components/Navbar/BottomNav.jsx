import { NavLink } from 'react-router-dom';
import { Home, User, Bike, Map } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t"
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
        <Map size={22} />
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
