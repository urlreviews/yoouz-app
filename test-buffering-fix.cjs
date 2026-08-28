const fs = require('fs');

let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf8');

// Replace the buffer state handling with aggressive loading fix
const oldCode = `  // 1.5s Buffering & Stalled Timeout Fallback: Force-hide spinner and kickstart media playback
  useEffect(() => {
    if (isBuffering && isActive) {
      if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = setTimeout(() => {
        setIsBuffering(false);
        const el = videoRef.current;
        if (el) {
          try {
            if (el.paused) {
              el.play().catch(() => {});
            }
          } catch (e) {}
        }
      }, 1500);
    } else {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }
    }

    return () => {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
    };
  }, [isBuffering, isActive]);`;


const newCode = `  // Aggressive 1.5s Buffering Timeout - Replaces loading with error state if stalled
  useEffect(() => {
    if (isBuffering && isActive) {
      if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = setTimeout(() => {
        const el = videoRef.current;
        
        // If it's still buffering after 1.5s, something went wrong with the initial load/stream
        setIsBuffering(false);
        if (el && el.currentTime === 0) {
            setHasError(true);
        } else if (el) {
          try {
            if (el.paused) {
              el.play().catch(() => {});
            }
          } catch (e) {}
        }
      }, 1500);
    } else {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }
    }

    return () => {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
    };
  }, [isBuffering, isActive]);`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('src/components/VideoFeedCard.tsx', content);
  console.log("Patched aggressive buffering timeout");
} else {
  console.log("Could not find buffering timeout block");
}
