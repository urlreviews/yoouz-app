import { useState, useEffect } from 'react';

// Browser autoplay policies strictly require user interaction on the CURRENT document before unmuting media.
// Attempting unmuted playback on fresh document load causes Chrome/Safari to pause the video and log:
// "Unmuting failed and the element was paused instead because the user didn't interact with the document before."
// Therefore, on cold page load / fresh document session, audio MUST always start muted (isMuted = true, isUnlocked = false).
// This guarantees that the first video plays instantly at 60fps without browser interference,
// and the prominent "Tap to Unmute" button is GUARANTEED to appear immediately on the first video.
let globalAudioUnlocked = false;
let globalIsMuted = true;

// If the user previously chose unmuted audio in a past session, as soon as they tap or click ANYWHERE
// on the page (an authentic user gesture), immediately unlock the audio session safely!
if (typeof window !== 'undefined') {
  const onFirstInteraction = () => {
    window.removeEventListener('click', onFirstInteraction, true);
    window.removeEventListener('touchstart', onFirstInteraction, true);
    window.removeEventListener('keydown', onFirstInteraction, true);
    try {
      const saved = localStorage.getItem("yoouz_sound_muted");
      if (saved === "false" && !globalAudioUnlocked) {
        triggerAudioUnlock();
      }
    } catch {}
  };
  window.addEventListener('click', onFirstInteraction, { capture: true, once: true });
  window.addEventListener('touchstart', onFirstInteraction, { capture: true, once: true });
  window.addEventListener('keydown', onFirstInteraction, { capture: true, once: true });
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
