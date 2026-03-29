import { useAuth } from '../../context/AuthContext.jsx';
import { getShopMeta } from '../../utils/shopColors.js';

export default function TopBar() {
  const { user, activeShop } = useAuth();
  const shopMeta = activeShop ? getShopMeta(activeShop.name) : null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between px-4"
      style={{ background: 'var(--charcoal)', borderBottom: '1px solid #3D3D3D' }}
    >
      {/* Shop badge */}
      {shopMeta ? (
        <span
          className="rounded-lg px-3 py-1 text-sm font-bold"
          style={{ background: shopMeta.primary, color: '#fff' }}
        >
          {activeShop.name}
        </span>
      ) : (
        <span className="text-sm text-gray-500">—</span>
      )}

      {/* User info */}
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
        </div>
      )}
    </header>
  );
}
