import { useState, useEffect } from 'react';

// Industry-standard mobile PWA behavior (matching TikTok, Instagram, YouTube Shorts):
// Fresh cold sessions ALWAYS start muted so native iOS Safari & Android Chrome autoplay instantly with zero lag,
// zero permission freezes, and no browser security rejections.
// Once the user interacts and unmutes during their session, sound remains active across all scrolled videos.
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
    listeners.forEach(listener => listener(nextVal));
  };

  return [isMuted, setIsMuted] as const;
}
