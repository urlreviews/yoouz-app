import { useState, useEffect } from 'react';

// Retrieve persistent audio preference from localStorage (safely defaulting to false/true on first cold visit)
const getInitialMuted = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem("yoouz_sound_muted");
    if (saved === "false") return false;
  } catch {}
  return true;
};

const getInitialUnlocked = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem("yoouz_sound_muted");
    if (saved === "false") return true;
  } catch {}
  return false;
};

let globalAudioUnlocked = getInitialUnlocked();
let globalIsMuted = getInitialMuted();

let sharedAudioContext: AudioContext | null = null;
let hasCreatedUnlockBuffer = false;

/**
 * Permanently authorizes audio subsystem across all browsers (Safari, Firefox, Brave)
 * by unlocking the Web Audio AudioContext on first user gesture.
 */
export function ensureSharedAudioContextUnlocked() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!sharedAudioContext) {
        sharedAudioContext = new AudioContextClass();
      }
      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().catch(() => {});
      }
      if (!hasCreatedUnlockBuffer && sharedAudioContext.state === 'running') {
        hasCreatedUnlockBuffer = true;
        const buffer = sharedAudioContext.createBuffer(1, 1, 22050);
        const source = sharedAudioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(sharedAudioContext.destination);
        source.start(0);
      }
    }
  } catch (e) {}
}

const muteListeners = new Set<(val: boolean) => void>();
const unlockListeners = new Set<(val: boolean) => void>();

export function useGlobalMute() {
  const [isMuted, setIsMutedState] = useState(globalIsMuted);
  const [isUnlocked, setIsUnlockedState] = useState(globalAudioUnlocked);

  useEffect(() => {
    muteListeners.add(setIsMutedState);
    unlockListeners.add(setIsUnlockedState);
    return () => {
      muteListeners.delete(setIsMutedState);
      unlockListeners.delete(setIsUnlockedState);
    };
  }, []);

  const setIsMuted = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(globalIsMuted) : val;
    globalIsMuted = nextVal;
    try {
      localStorage.setItem("yoouz_sound_muted", String(nextVal));
    } catch {}
    if (!nextVal) {
      globalAudioUnlocked = true;
      ensureSharedAudioContextUnlocked();
      unlockListeners.forEach(listener => listener(true));
    }
    muteListeners.forEach(listener => listener(nextVal));
  };

  const unlockAudioSession = () => {
    globalAudioUnlocked = true;
    globalIsMuted = false;
    ensureSharedAudioContextUnlocked();
    try {
      localStorage.setItem("yoouz_sound_muted", "false");
    } catch {}
    unlockListeners.forEach(listener => listener(true));
    muteListeners.forEach(listener => listener(false));
  };

  return [isMuted, setIsMuted, isUnlocked, unlockAudioSession] as const;
}

export function isAudioUnlocked(): boolean {
  return globalAudioUnlocked;
}

export function triggerAudioUnlock() {
  globalAudioUnlocked = true;
  globalIsMuted = false;
  ensureSharedAudioContextUnlocked();
  try {
    localStorage.setItem("yoouz_sound_muted", "false");
  } catch {}
  unlockListeners.forEach(listener => listener(true));
  muteListeners.forEach(listener => listener(false));
}
