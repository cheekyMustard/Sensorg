import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Delivery from './pages/Delivery.jsx';
import Notes from './pages/Notes.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import Jokes from './pages/Jokes.jsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/delivery', element: <Delivery /> },
      { path: '/notes', element: <Notes /> },
      { path: '/profile', element: <Profile /> },
      { path: '/admin', element: <Admin /> },
      { path: '/jokes', element: <Jokes /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
