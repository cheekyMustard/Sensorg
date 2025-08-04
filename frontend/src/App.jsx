import Home from './pages/Home.jsx';
import BottomNav from './components/BottomNav.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-primary text-white">
        <h1 className="text-2xl font-bold">Sensational Organiser</h1>
      </header>
      <main className="flex-1">
        <Home />
      </main>
      <BottomNav />
    </div>
  );
}
