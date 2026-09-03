import { useState, useEffect } from 'react';

// Track if user has touched/interacted with the viewport during this session
let hasUserInteracted = false;

// Initialize from localStorage if the user explicitly set a sound preference
let globalIsMuted = (() => {
  try {
    const saved = localStorage.getItem("yoouz_sound_muted");
    if (saved !== null) {
      return saved === "true";
    }
  } catch (e) {}
  // Default to false (sound enabled)
  return false;
})();

const listeners = new Set<(val: boolean) => void>();
const interactionListeners = new Set<(interacted: boolean) => void>();

export function isAudioUnlocked(): boolean {
  return hasUserInteracted;
}

export function triggerAudioUnlock() {
  if (!hasUserInteracted) {
    hasUserInteracted = true;
    interactionListeners.forEach(listener => listener(true));
  }
}

// Global window listeners to catch the very first touch/click/scroll anywhere
if (typeof window !== 'undefined') {
  const onFirstInteraction = () => {
    triggerAudioUnlock();
  };

  ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown', 'scroll'].forEach(evt => {
    window.addEventListener(evt, onFirstInteraction, { passive: true, capture: true });
  });
}

export function useGlobalMute() {
  const [isMuted, setIsMutedState] = useState(globalIsMuted);
  const [interacted, setInteracted] = useState(hasUserInteracted);

  useEffect(() => {
    listeners.add(setIsMutedState);
    interactionListeners.add(setInteracted);
    return () => {
      listeners.delete(setIsMutedState);
      interactionListeners.delete(setInteracted);
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

  return [isMuted, setIsMuted, interacted] as const;
}

