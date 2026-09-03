/**
 * Clean & resilient Audio Session Engine for iOS Safari, Android Chrome, Desktop, and Mobile WebViews.
 * 
 * Unlocks Web Audio on first gesture so that unmuted playback is never blocked by browser policies.
 */

let globalAudioCtx: AudioContext | null = null;
let isAudioSessionUnlocked = false;

export const unlockMobileAudioSession = () => {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!globalAudioCtx) {
      globalAudioCtx = new AudioCtx();
      (window as any).__copoAudioCtx = globalAudioCtx;
    }

    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch(() => {});
    }

    // Standard 1-sample silent buffer trigger to unlock iOS audio channel cleanly
    if (!isAudioSessionUnlocked && globalAudioCtx.state === "running") {
      try {
        const buffer = globalAudioCtx.createBuffer(1, 1, 22050);
        const source = globalAudioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(globalAudioCtx.destination);
        source.start(0);
        isAudioSessionUnlocked = true;
      } catch (e) {}
    } else if (globalAudioCtx.state === "running") {
      isAudioSessionUnlocked = true;
    }
  } catch (e) {}
};

// Bind to mobile & desktop user gestures
if (typeof window !== "undefined") {
  const primeHandler = () => {
    unlockMobileAudioSession();
  };

  window.addEventListener("touchstart", primeHandler, { passive: true });
  window.addEventListener("touchend", primeHandler, { passive: true });
  window.addEventListener("click", primeHandler, { passive: true });
  window.addEventListener("keydown", primeHandler, { passive: true });
}

export const isMobileAudioUnlocked = () => isAudioSessionUnlocked;
