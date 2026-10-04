import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Handle Service Worker
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  } else if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('PWA ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('PWA ServiceWorker registration failed:', error);
        });
    });
  }
}

