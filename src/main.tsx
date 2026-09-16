import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LanguageProvider } from './i18n/LanguageContext.tsx';
import './index.css';

// Initialize Sentry Monitoring with exact project DSN
Sentry.init({
  dsn: "https://a157fe76e41983b0b082124a3adc128e@o4512096517292032.ingest.us.sentry.io/4512096535576576",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV || "production"
});

// Send an explicit test exception to satisfy Sentry's onboarding "Verify" check
try {
  Sentry.captureException(new Error("Yoouz Sentry verification test error"));
} catch (e) {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Dismiss initial HTML splash loader once React has painted its initial frame
if (typeof (window as any).__dismissAppSplash === 'function') {
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (typeof (window as any).__dismissAppSplash === 'function') {
        (window as any).__dismissAppSplash();
      }
    }, 50);
  });
}

// Proactively purge ALL stale service workers and cache storage to completely prevent stale mobile code
if (typeof window !== 'undefined') {
  let lastClickedInfo = "";
  window.addEventListener('click', (e) => {
    try {
      const target = e.target as HTMLElement;
      if (target) {
        const btn = target.closest('button, a, input, [role="button"]');
        const text = (btn?.textContent || target.textContent || "").trim().slice(0, 50);
        lastClickedInfo = `Clicked <${target.tagName.toLowerCase()}> "${text}" on ${window.location.pathname}`;
      }
    } catch(err) {}
  }, true);

  window.addEventListener('error', (event) => {
    try {
      if (event.error) {
        Sentry.captureException(event.error, { extra: { lastClicked: lastClickedInfo } });
      } else {
        Sentry.captureMessage(event.message || "Unhandled Window Error", { extra: { lastClicked: lastClickedInfo } });
      }
      fetch("/api/system/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: event.message || "Unhandled Window Error",
          stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
          component: lastClickedInfo ? lastClickedInfo : "Window Global",
          category: "buttons",
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {});
    } catch (e) {}
  });

  window.addEventListener('unhandledrejection', (event) => {
    try {
      if (event.reason instanceof Error) {
        Sentry.captureException(event.reason, { extra: { lastClicked: lastClickedInfo } });
      } else {
        Sentry.captureMessage(String(event.reason) || "Unhandled Promise Rejection", { extra: { lastClicked: lastClickedInfo } });
      }
      fetch("/api/system/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: event.reason?.message || String(event.reason) || "Unhandled Promise Rejection",
          stack: event.reason?.stack,
          component: lastClickedInfo ? lastClickedInfo : "Promise Rejection",
          category: "network",
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {});
    } catch (e) {}
  });
}
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    }).catch(() => {});
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }

