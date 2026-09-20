/**
 * Global App Error Telemetry & Issue Monitor
 * Tracks application health, issue code #39 (Realtime Stream / Network) & issue code #40 (API & Resource Health).
 */

export interface AppErrorEntry {
  id: string;
  code: number; // e.g. 39 for Stream/Network, 40 for API/Resource, 50 for General
  type: string; // "stream" | "api" | "resource" | "runtime"
  message: string;
  timestamp: number;
  url?: string;
  resolved: boolean;
}

export interface AppHealthSummary {
  totalErrors: number;
  issue39Errors: number; // Realtime Streams & WebSockets
  issue40Errors: number; // API & Resource Loading
  status: "healthy" | "warning" | "error";
  lastChecked: number;
}

const ERROR_LOGS_KEY = "yoouz_app_error_logs_v1";

let localErrorLogs: AppErrorEntry[] = [];
const listeners = new Set<(summary: AppHealthSummary, logs: AppErrorEntry[]) => void>();

function loadSavedLogs(): AppErrorEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ERROR_LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
}

function saveLogs() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(localErrorLogs.slice(0, 50)));
  } catch (e) {}
}

localErrorLogs = loadSavedLogs();

export function getAppErrorLogs(): AppErrorEntry[] {
  return [...localErrorLogs];
}

export function getAppHealthSummary(): AppHealthSummary {
  const activeLogs = localErrorLogs.filter((l) => !l.resolved);
  const issue39 = activeLogs.filter((l) => l.code === 39).length;
  const issue40 = activeLogs.filter((l) => l.code === 40).length;
  const total = activeLogs.length;

  return {
    totalErrors: total,
    issue39Errors: issue39,
    issue40Errors: issue40,
    status: total === 0 ? "healthy" : total < 5 ? "warning" : "error",
    lastChecked: Date.now()
  };
}

export function logAppError(type: "stream" | "api" | "resource" | "runtime", message: string, url?: string): void {
  // Determine issue code (#39 for Stream/Network, #40 for API/Resource, 50 for general)
  const code = type === "stream" ? 39 : type === "api" || type === "resource" ? 40 : 50;

  // Deduplicate identical recent errors within 10 seconds
  const now = Date.now();
  const existingIndex = localErrorLogs.findIndex(
    (l) => l.code === code && l.message === message && now - l.timestamp < 10000
  );

  if (existingIndex >= 0) {
    localErrorLogs[existingIndex].timestamp = now;
  } else {
    const entry: AppErrorEntry = {
      id: `err-${now}-${Math.random().toString(36).slice(2, 6)}`,
      code,
      type,
      message,
      timestamp: now,
      url,
      resolved: false
    };
    localErrorLogs.unshift(entry);
    if (localErrorLogs.length > 100) {
      localErrorLogs = localErrorLogs.slice(0, 100);
    }
  }

  saveLogs();
  notifyListeners();
}

export function resolveAllAppErrors(): void {
  localErrorLogs = [];
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(ERROR_LOGS_KEY);
    } catch (e) {}
  }
  notifyListeners();
}

export function subscribeAppHealth(cb: (summary: AppHealthSummary, logs: AppErrorEntry[]) => void): () => void {
  listeners.add(cb);
  cb(getAppHealthSummary(), getAppErrorLogs());
  return () => {
    listeners.delete(cb);
  };
}

function notifyListeners() {
  const summary = getAppHealthSummary();
  const logs = getAppErrorLogs();
  listeners.forEach((fn) => {
    try {
      fn(summary, logs);
    } catch (e) {}
  });
}

// Global window event listener initialization
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason?.message || String(e.reason || "Unhandled Promise Rejection");
    if (reason.includes("EventSource") || reason.includes("stream") || reason.includes("503")) {
      logAppError("stream", reason);
    } else if (reason.includes("fetch") || reason.includes("HTTP")) {
      logAppError("api", reason);
    }
  });
}
