import React from 'react';

export default function BottomNav() {
  const items = [
    { label: 'Start', icon: '🏠' },
    { label: 'Anfragen', icon: '🚚' },
    { label: 'Notizen', icon: '📝' },
    { label: 'Neues', icon: '➕' },
    { label: 'Admin', icon: '⚙️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-base border-t border-neutral">
      <ul className="flex justify-around">
        {items.map(({ label, icon }) => (
          <li
            key={label}
            className={`flex flex-col items-center py-2 ${
              label === 'Start'
                ? 'text-primary'
                : 'text-neutral hover:text-primary'
            }`}
          >
            <span>{icon}</span>
            <span className="text-xs">{label}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}

