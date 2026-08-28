const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

const target = `  // Sync mute property changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);`;

const replacement = `  // Sync mute property changes
  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = isMuted;
    }
  }, [isMuted]);

  // Attempt to recover unmuted playback on any user interaction if the browser forced it muted
  useEffect(() => {
    if (!isActive || isMuted) return;
    
    const recoverAudio = () => {
      const el = videoRef.current;
      if (el && el.muted && !isMuted) {
        el.muted = false;
      }
    };

    window.addEventListener('touchstart', recoverAudio, { passive: true });
    window.addEventListener('click', recoverAudio, { passive: true });
    window.addEventListener('scroll', recoverAudio, { passive: true });

    return () => {
      window.removeEventListener('touchstart', recoverAudio);
      window.removeEventListener('click', recoverAudio);
      window.removeEventListener('scroll', recoverAudio);
    };
  }, [isActive, isMuted]);`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Updated mute sync");
