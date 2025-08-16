import { Outlet } from 'react-router-dom';
import RadNavigation from './components/RadNavigation';

function App() {
  return (
    <div className="relative min-h-screen bg-[#D1BBA2] text-[#2D2D2D]">
      <Outlet />
      <RadNavigation />
    </div>
  );
}

export default App;
