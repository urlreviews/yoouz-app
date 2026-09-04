import { useState, useEffect } from 'react';

// Track if user has touched/interacted with the viewport during this session
let hasUserInteracted = false;

// Sound is enabled by default across the app
let globalIsMuted = false;

try {
  // Clear any old muted state so sound is always on by default
  const saved = localStorage.getItem("yoouz_sound_muted");
  if (saved === "true") {
    localStorage.removeItem("yoouz_sound_muted");
  }
} catch (e) {}

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
  const onFirstInteraction = (e: Event) => {
    triggerAudioUnlock();

    // Directly unmute and play the active video within the active synchronous event gesture stack
    if (!globalIsMuted) {
      document.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
        if (video.getAttribute("data-active") === "true") {
          try {
            if (video.muted) {
              video.muted = false;
              video.volume = 1;
              video.play().catch(() => {});
            }
          } catch (err) {}
        }
      });
    }
  };

  // DO NOT use passive: true for core user input events, as it prevents Safari from honoring media actions
  ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, onFirstInteraction, { passive: false, capture: true });
  });

  // Use passive: true safely for high-frequency scroll/move events
  ['touchmove', 'scroll', 'wheel'].forEach(evt => {
    window.addEventListener(evt, () => triggerAudioUnlock(), { passive: true, capture: true });
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

