import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Package, StickyNote, User, Settings, Smile, Bike } from 'lucide-react';

const items = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/delivery', icon: Package, label: 'Delivery' },
  { path: '/notes', icon: StickyNote, label: 'Notes' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/admin', icon: Settings, label: 'Admin' },
  { path: '/jokes', icon: Smile, label: 'Jokes' },
];

export default function RadNavigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const radius = 80;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
      >
        <motion.div animate={{ rotate: open ? 360 : 0 }} transition={{ duration: 0.5 }}>
          <Bike />
        </motion.div>
      </button>
      <AnimatePresence>
        {open &&
          items.map((item, index) => {
            const angle = (index / items.length) * (2 * Math.PI) - Math.PI / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, x, y }}
                exit={{ opacity: 0, x: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute top-1/2 left-1/2"
              >
                <Link
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow bg-base ${active ? 'text-primary' : 'text-neutral'}`}
                >
                  <Icon size={20} />
                </Link>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
