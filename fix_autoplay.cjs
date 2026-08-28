const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

const target = `    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.warn("Autoplay promise notice:", err.message);
      
      try {
        el.muted = true;
        if (!isMuted) {
          setIsGlobalMuted(true);
        }
        if (isActive) setIsPlaying(true);
        await el.play();
        if (isActive) {
          setHasError(false);
        }
      } catch (e: any) {
        if (e.name !== "AbortError" && isActive) {
          setIsPlaying(false);
        }
      }
    }`;

const replacement = `    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.warn("Autoplay promise notice:", err.message);
      
      // Browser blocked autoplay. DO NOT alter the user's global mute preference.
      try {
        // Fallback to muted autoplay so the video at least plays (TikTok style)
        el.muted = true;
        if (isActive) setIsPlaying(true);
        await el.play();
        if (isActive) setHasError(false);
      } catch (e: any) {
        if (e.name !== "AbortError" && isActive) {
          setIsPlaying(false);
        }
      }
    }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Updated autoplay fallback");
