import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                  = useState(null);
  const [loading, setLoading]            = useState(true);
  const [activeShop, setActiveShopState] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    const savedShop = localStorage.getItem('activeShop');
    if (savedShop) setActiveShopState(JSON.parse(savedShop));

    getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const setActiveShop = useCallback((shop) => {
    setActiveShopState(shop);
    if (shop) localStorage.setItem('activeShop', JSON.stringify(shop));
    else localStorage.removeItem('activeShop');
  }, []);

  const login = useCallback(async (username, password, shop) => {
    const data = await apiLogin(username, password, shop?.id ?? null);
    localStorage.setItem('token', data.token);
    setActiveShop(shop);
    setUser(data.user);
    return data.user;
  }, [setActiveShop]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeShop');
    setUser(null);
    setActiveShopState(null);
  }, []);

  /**
   * Returns true if the logged-in user holds at least one of the given roles.
   * Usage: hasRole('admin', 'organiser')
   */
  const hasRole = useCallback((...roles) => {
    return user?.roles?.some(r => roles.includes(r)) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, activeShop, setActiveShop, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
