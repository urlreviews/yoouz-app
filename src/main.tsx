import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LanguageProvider } from './i18n/LanguageContext.tsx';
import './index.css';

// Silent stale-cache cleanup without ever forcing a jarring reload on first/Incognito visits
const CURRENT_APP_VERSION = "v20261118_safari_fix_v2";
if (typeof localStorage !== 'undefined') {
  try {
    const savedVer = localStorage.getItem("yoouz_app_version");
    if (savedVer !== CURRENT_APP_VERSION) {
      localStorage.setItem("yoouz_app_version", CURRENT_APP_VERSION);
      if (savedVer) {
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          }).catch(() => {});
        }
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) => {
            regs.forEach((reg) => reg.unregister().catch(() => {}));
          }).catch(() => {});
        }
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key !== "yoouz_app_version" && !key.includes("auth") && !key.includes("user")) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (e) {}
}

// Purge any stale client-side caches synchronously before initial render
if (typeof localStorage !== 'undefined') {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("yoouz_cached_videos_") || key === "copo_videos") && key !== "yoouz_cached_videos_v50_photo_pivot") {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Proactively purge ALL stale service workers and cache storage to completely prevent stale mobile code
if (typeof window !== 'undefined') {
  let lastClickedInfo = "";
  const reportedErrorKeys = new Set<string>();
  const isBenignBrowserNoise = (msg: string, stack?: string) => {
    const m = (msg || "").toLowerCase();
    const s = (stack || "").toLowerCase();
    if (!m || m === "script error." || m === "script error" || m === "undefined" || m === "[object event]") return true;
    if (m.includes("resizeobserver loop")) return true;
    if (m.includes("aborterror") || m.includes("the user aborted a request") || m.includes("play() request was interrupted") || m.includes("notallowederror")) return true;
    if (m.includes("websocket") || s.includes("/@vite/client")) return true;
    return false;
  };

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
      const msg = event.message || "";
      const stack = event.error?.stack || `${event.filename || ""}:${event.lineno}:${event.colno}`;
      if (isBenignBrowserNoise(msg, stack)) return;
      const dedupeKey = `err:${msg}:${event.filename || ""}:${event.lineno}`;
      if (reportedErrorKeys.has(dedupeKey)) return;
      reportedErrorKeys.add(dedupeKey);
      fetch("/api/system/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg || "Unhandled Window Error",
          stack,
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
      const reason = event.reason;
      const msg = reason?.message || (typeof reason === "string" ? reason : "");
      const stack = reason?.stack || "";
      if (reason?.name === "AbortError" || reason?.name === "NotAllowedError" || isBenignBrowserNoise(msg, stack)) return;
      const dedupeKey = `rej:${msg}`;
      if (reportedErrorKeys.has(dedupeKey)) return;
      reportedErrorKeys.add(dedupeKey);
      fetch("/api/system/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg || "Unhandled Promise Rejection",
          stack,
          component: lastClickedInfo ? lastClickedInfo : "Promise Rejection",
          category: "network",
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {});
    } catch (e) {}
  });

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
}

