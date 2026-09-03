/**
 * Zero-Drop Audio Session Engine for iOS Safari, Android Chrome, and Mobile WebViews.
 * 
 * Root Cause in Mobile Browsers (WebKit & Blink):
 * When swiping rapidly through a video feed, unmounting/mounting HTML5 video tags causes
 * the browser's audio routing subsystem to momentarily reset audio permissions, forcing newly
 * mounted video tags to reject `.play()` unless `muted = true` is assigned.
 * 
 * Solution:
 * 1. Maintain a persistent, singleton Web Audio Context + Silent Oscillator Carrier
 *    that keeps the mobile OS audio pipeline alive across fast swipes.
 * 2. Pre-prime all new video tags immediately upon instantiation with an active unmuted state.
 * 3. Never reset the user's global unmuted preference during gesture-driven feed transitions.
 */

let globalAudioCtx: AudioContext | null = null;
let silentOscillatorNode: OscillatorNode | null = null;
let silentGainNode: GainNode | null = null;
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

    // Keep an ultra-low frequency (sub-audible) zero-gain carrier running
    // This instructs iOS Safari & Android Chrome that the page owns an active audio session
    if (!silentOscillatorNode && globalAudioCtx.state === "running") {
      try {
        silentGainNode = globalAudioCtx.createGain();
        silentGainNode.gain.value = 0.0001; // Virtually silent
        silentGainNode.connect(globalAudioCtx.destination);

        silentOscillatorNode = globalAudioCtx.createOscillator();
        silentOscillatorNode.frequency.value = 20; // 20Hz (inaudible bottom boundary)
        silentOscillatorNode.connect(silentGainNode);
        silentOscillatorNode.start();
        isAudioSessionUnlocked = true;
      } catch (e) {}
    } else if (globalAudioCtx.state === "running") {
      isAudioSessionUnlocked = true;
    }
  } catch (e) {}
};

// Automatically bind to high-priority mobile gesture listeners
if (typeof window !== "undefined") {
  const primeHandler = () => {
    unlockMobileAudioSession();
  };

  window.addEventListener("touchstart", primeHandler, { passive: true });
  window.addEventListener("touchmove", primeHandler, { passive: true });
  window.addEventListener("touchend", primeHandler, { passive: true });
  window.addEventListener("click", primeHandler, { passive: true });
  window.addEventListener("keydown", primeHandler, { passive: true });
  window.addEventListener("scroll", primeHandler, { passive: true });
}

export const isMobileAudioUnlocked = () => isAudioSessionUnlocked;
