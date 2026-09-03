import { useState, useEffect } from 'react';
import { unlockMobileAudioSession } from '../utils/audioSessionManager';

// Industry-standard mobile PWA behavior (matching TikTok, Instagram, YouTube Shorts):
// Fresh cold sessions start muted for instant autoplay, but once unmuted,
// audio session persistence ensures sound NEVER drops or gets muted during fast swiping.
let globalIsMuted = true;

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
    if (!nextVal) {
      unlockMobileAudioSession();
    }
    listeners.forEach(listener => listener(nextVal));
  };

  return [isMuted, setIsMuted] as const;
}

