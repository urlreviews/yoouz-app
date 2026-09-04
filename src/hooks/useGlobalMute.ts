import { useState, useEffect } from 'react';

// Start initial session with muted = true to guarantee 100% browser autoplay policy compliance across all devices
let globalAudioUnlocked = false;
let globalIsMuted = true;

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
    if (!nextVal) {
      globalAudioUnlocked = true;
      unlockListeners.forEach(listener => listener(true));
    }
    muteListeners.forEach(listener => listener(nextVal));
  };

  const unlockAudioSession = () => {
    globalAudioUnlocked = true;
    globalIsMuted = false;
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
  unlockListeners.forEach(listener => listener(true));
  muteListeners.forEach(listener => listener(false));
}
