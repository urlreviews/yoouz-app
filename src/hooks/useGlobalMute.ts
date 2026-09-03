import { useState, useEffect } from 'react';

// Initialize from localStorage if the user previously set a sound preference
let globalIsMuted = (() => {
  try {
    const saved = localStorage.getItem("yoouz_sound_muted");
    if (saved !== null) {
      return saved === "true";
    }
  } catch (e) {}
  // Default to unmuted on interactive web sessions once unlocked, or false for desktop
  return false;
})();

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

