import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { SHOP_META } from '../utils/shopColors.js';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [selectedShop, setSelectedShop] = useState(null);
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState('');
  const [shopError, setShopError]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedShop) { setShopError(true); return; }
    setShopError(false);
    setError('');
    setLoading(true);
    try {
      await login(username, password, selectedShop);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function selectShop(shop) {
    setSelectedShop(shop);
    setShopError(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: 'var(--brand-bg)' }}>
      {/* Brand header */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-md" style={{ background: 'var(--charcoal)' }}>
          <Bike size={32} style={{ color: 'var(--brand)' }} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--charcoal)' }}>
          Bike Sensations
        </h1>
        <p className="text-sm" style={{ color: '#888' }}>Organiser</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md" style={{ border: '1px solid var(--brand-border)' }}>

        {/* Shop selector */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#aaa' }}>
          Where are you working today?
        </p>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {SHOP_META.map(shop => {
            const isSelected = selectedShop?.id === shop.id;
            return (
              <button
                key={shop.id}
                type="button"
                onClick={() => selectShop(shop)}
                style={{
                  background:    isSelected ? shop.primary : shop.light,
                  border:        `2px solid ${isSelected ? shop.dark : shop.border}`,
                  color:         isSelected ? '#fff' : shop.text,
                  boxShadow:     isSelected
                    ? `inset 0 3px 6px rgba(0,0,0,0.25)`
                    : `0 4px 0 ${shop.border}, 0 2px 6px rgba(0,0,0,0.1)`,
                  transform:     isSelected ? 'translateY(4px)' : 'translateY(0)',
                  transition:    'all 0.1s ease',
                  borderRadius:  '0.75rem',
                  padding:       '0.75rem 0.25rem',
                  fontWeight:    700,
                  fontSize:      '0.85rem',
                  cursor:        'pointer',
                }}
              >
                {isSelected && (
                  <span className="flex items-center justify-center gap-1">
                    <Check size={13} strokeWidth={3} />
                    {shop.name}
                  </span>
                )}
                {!isSelected && shop.name}
              </button>
            );
          })}
        </div>

        {shopError && (
          <p role="alert" className="mb-4 rounded-lg px-3 py-2 text-xs font-medium text-red-700" style={{ background: '#FEE2E2' }}>
            Please select your shop before signing in.
          </p>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none transition-shadow"
              style={{ borderColor: 'var(--brand-border)' }}
              onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--brand)'}
              onBlur={e => e.target.style.boxShadow = 'none'}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none transition-shadow"
                style={{ borderColor: 'var(--brand-border)' }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--brand)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: selectedShop ? selectedShop.primary : 'var(--brand)' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = selectedShop ? selectedShop.dark : 'var(--brand-dark)'; }}
            onMouseLeave={e => e.currentTarget.style.background = selectedShop ? selectedShop.primary : 'var(--brand)'}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
