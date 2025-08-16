# 🚲 Bike Rad-Navigation Integration

Diese Anleitung beschreibt, wie du die Rad-Navigationskomponente in ein bestehendes React-Projekt (z. B. mit Vite + Tailwind) integrierst. Die Navigation funktioniert wie ein sich drehendes Fahrrad-Rad am unteren Bildschirmrand.

---

## 🔧 Voraussetzungen

- React-Projekt (z. B. mit Vite)
- `react-router-dom`
- `framer-motion`
- `lucide-react` (für Icons)
- Optional: TailwindCSS (empfohlen)

---

## 📁 Projektstruktur (neu)

```
src/
├── components/
│   └── RadNavigation.jsx       ← NEU
├── pages/
│   ├── Home.jsx                ← Beispielseite
│   ├── Delivery.jsx            ← Beispielseite
│   └── Notes.jsx               ← Beispielseite
├── App.jsx                     ← ANPASSEN
└── main.jsx                    ← ANPASSEN
```

---

## 🧩 Schritte zur Integration

### 1. Komponenten & Seiten einfügen

- Kopiere `RadNavigation.jsx` in `src/components`
- Lege die Seiten `Home.jsx`, `Delivery.jsx`, `Notes.jsx` in `src/pages` an

### 2. `App.jsx` anpassen

```jsx
import { Outlet } from 'react-router-dom'
import RadNavigation from './components/RadNavigation'

function App() {
  return (
    <div className="relative min-h-screen bg-[#D1BBA2] text-[#2D2D2D]">
      <Outlet />
      <RadNavigation />
    </div>
  )
}

export default App
```

### 3. `main.jsx` einrichten

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Delivery from './pages/Delivery'
import Notes from './pages/Notes'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/delivery', element: <Delivery /> },
      { path: '/notes', element: <Notes /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)
```

---

## 📦 Abhängigkeiten installieren

```bash
npm install react-router-dom framer-motion lucide-react
```

---

## 🧪 Starten & Testen

```bash
npm run dev
```

Die Rad-Navigation erscheint unten zentriert. Beim Öffnen dreht sich das Rad und zeigt 6 Menüpunkte an. Nach Auswahl klappt es ein und wechselt die Seite.

---

## ✅ Fertig!

Jetzt kannst du weitere Seiten, Icons oder Animationen nach Belieben erweitern.
