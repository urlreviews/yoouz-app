import { useState, useEffect } from 'react';

// Browser autoplay policies strictly require user interaction on the CURRENT document before unmuting media.
// Attempting unmuted playback on fresh document load causes Chrome/Safari to pause the video.
// Therefore, on cold page load / fresh document session, audio MUST always start muted (isMuted = true, isUnlocked = false).
// This guarantees that the first video plays instantly at 60fps without browser interference,
// and the prominent "Tap to Unmute" button is GUARANTEED to appear immediately on the first video.
let globalAudioUnlocked = false;
let globalIsMuted = true;

// Clean up any stale localStorage sound flags from prior versions to prevent state desync between regular and private browsing
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem("yoouz_sound_muted");
  } catch {}
}

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

interface GlobalAudioState {
  isMuted: boolean;
  isUnlocked: boolean;
}

const audioStateListeners = new Set<(state: GlobalAudioState) => void>();

export function forceMute() {
  globalIsMuted = true;
  const nextState = { isMuted: true, isUnlocked: globalAudioUnlocked };
  audioStateListeners.forEach(listener => listener(nextState));
}

export function useGlobalMute() {
  const [audioState, setAudioState] = useState<GlobalAudioState>({
    isMuted: globalIsMuted,
    isUnlocked: globalAudioUnlocked
  });

  useEffect(() => {
    const listener = (nextState: GlobalAudioState) => {
      setAudioState(nextState);
    };
    audioStateListeners.add(listener);
    return () => {
      audioStateListeners.delete(listener);
    };
  }, []);

  const setIsMuted = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(globalIsMuted) : val;
    globalIsMuted = nextVal;
    if (!nextVal) {
      globalAudioUnlocked = true;
      ensureSharedAudioContextUnlocked();
    }
    const nextState = { isMuted: globalIsMuted, isUnlocked: globalAudioUnlocked };
    audioStateListeners.forEach(listener => listener(nextState));
  };

  const unlockAudioSession = () => {
    globalAudioUnlocked = true;
    globalIsMuted = false;
    ensureSharedAudioContextUnlocked();
    const nextState = { isMuted: false, isUnlocked: true };
    audioStateListeners.forEach(listener => listener(nextState));
  };

  return [audioState.isMuted, setIsMuted, audioState.isUnlocked, unlockAudioSession] as const;
}

export function isAudioUnlocked(): boolean {
  return globalAudioUnlocked;
}

export function triggerAudioUnlock() {
  globalAudioUnlocked = true;
  globalIsMuted = false;
  ensureSharedAudioContextUnlocked();
  const nextState = { isMuted: false, isUnlocked: true };
  audioStateListeners.forEach(listener => listener(nextState));
}
