import { useState, useEffect } from 'react';

// Default to muted (true) on fresh document load so browser autoplay is 100% compliant and never blocked
let globalAudioUnlocked = false;
let globalIsMuted = true;

let sharedAudioContext: AudioContext | null = null;

/**
 * Permanently authorizes audio subsystem across all browsers and devices
 * by unlocking the Web Audio AudioContext on user gesture.
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
      const buffer = sharedAudioContext.createBuffer(1, 1, 22050);
      const source = sharedAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(sharedAudioContext.destination);
      source.start(0);
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
      if (typeof document !== 'undefined') {
        document.querySelectorAll<HTMLVideoElement>("video").forEach(v => {
          v.muted = false;
          v.volume = 1;
        });
      }
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
    if (typeof document !== 'undefined') {
      document.querySelectorAll<HTMLVideoElement>("video").forEach(v => {
        v.muted = false;
        v.volume = 1;
      });
    }
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
  if (typeof document !== 'undefined') {
    document.querySelectorAll<HTMLVideoElement>("video").forEach(v => {
      v.muted = false;
      v.volume = 1;
    });
  }
  unlockListeners.forEach(listener => listener(true));
  muteListeners.forEach(listener => listener(false));
}
