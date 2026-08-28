const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

const safePlayTarget = `  const safePlay = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;

    try {
      el.muted = isMuted;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setHasError(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.warn("Autoplay promise notice:", err.message);
      
      // If unmuted playback was rejected by browser autoplay policy, fall back to muted autoplay
      // and update the global state to reflect reality (so UI shows Muted icon)
      try {
        el.muted = true;
        if (!isMuted) {
          setIsGlobalMuted(true);
        }
        await el.play();
        setIsPlaying(true);
        setHasError(false);
      } catch (e: any) {
        setIsPlaying(false);
      }
    }
  }, [isMuted]);`;

const safePlayReplacement = `  const safePlay = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;

    try {
      el.muted = isMuted;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        await playPromise;
        if (isActive) {
          setIsPlaying(true);
          setHasError(false);
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.warn("Autoplay promise notice:", err.message);
      
      try {
        el.muted = true;
        if (!isMuted) {
          setIsGlobalMuted(true);
        }
        await el.play();
        if (isActive) {
          setIsPlaying(true);
          setHasError(false);
        }
      } catch (e: any) {
        if (e.name !== "AbortError" && isActive) {
          setIsPlaying(false);
        }
      }
    }
  }, [isMuted, isActive]);`;

content = content.replace(safePlayTarget, safePlayReplacement);
fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Updated safePlay");
