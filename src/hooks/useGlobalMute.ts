import { useState, useEffect } from 'react';

// Read saved preference or default to unmuted (false) like standard desktop/YouTube Shorts
let globalIsMuted = false;
try {
  const saved = localStorage.getItem("yoouz_sound_muted");
  if (saved !== null) {
    globalIsMuted = saved === "true";
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
      localStorage.setItem("yoouz_sound_muted", String(nextVal));
    } catch (e) {}
    listeners.forEach(listener => listener(nextVal));
  };

  return [isMuted, setIsMuted] as const;
}

export function isAudioUnlocked(): boolean {
  return true;
}

export function triggerAudioUnlock() {
  // Clean no-op kept for any external calls
}
