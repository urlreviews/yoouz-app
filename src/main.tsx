import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Dismiss initial HTML splash loader immediately once React takes over
if (typeof (window as any).__dismissAppSplash === 'function') {
  (window as any).__dismissAppSplash();
}

// Proactively clear stale cache storage on startup to bust outdated assets
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      if (name !== 'yoouz-pwa-v7-fresh') {
        caches.delete(name);
      }
    });
  }).catch(() => {});
}

// Register Progressive Web App Service Worker with auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`).then((reg) => {
      reg.update().catch(() => {});
    }).catch((err) => {
      console.warn('PWA Service Worker registration skipped:', err);
    });
  });
}

