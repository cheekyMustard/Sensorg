import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import Login      from './pages/Login.jsx';
import Home       from './pages/Home.jsx';
import Profile    from './pages/Profile.jsx';
import Bikes      from './pages/Bikes.jsx';
import Excursions from './pages/Excursions.jsx';
import AdminPage  from './pages/Admin/AdminPage.jsx';
import BottomNav from './components/Navbar/BottomNav.jsx';
import TopBar    from './components/TopBar/TopBar.jsx';

const queryClient = new QueryClient();

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      {/* pt-14 offsets the fixed TopBar */}
      <div className="flex flex-col flex-1 pt-14">
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/bikes"      element={<Bikes />} />
          <Route path="/excursions" element={<Excursions />} />
          <Route path="/profile"    element={<Profile />} />
          <Route path="/admin"   element={
            user?.roles?.includes('admin') ? <AdminPage /> : <Navigate to="/" replace />
          } />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*"    element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
