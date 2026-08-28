import { useState, useEffect } from 'react';

// Global state outside the hook so it persists across unmounts
const STORAGE_KEY = 'copo_global_muted';
let globalIsMuted = true; // Always start a cold session as muted to guarantee Safari/iOS instant autoplay!
try {
  const saved = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    globalIsMuted = saved === 'true';
  }
} catch (e) {}

const listeners = new Set<(val: boolean) => void>();

export function useGlobalMute() {
  const [isMuted, setIsMutedState] = useState(globalIsMuted);

  useEffect(() => {
    listeners.add(setIsMutedState);
    return () => {
      listeners.delete(setIsMutedState);
    };
  }, []);

  const setIsMuted = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(globalIsMuted) : val;
    globalIsMuted = nextVal;
    try {
      localStorage.setItem(STORAGE_KEY, String(nextVal));
      sessionStorage.setItem(STORAGE_KEY, String(nextVal));
    } catch (e) {}
    listeners.forEach(listener => listener(nextVal));
  };

  return [isMuted, setIsMuted] as const;
}
