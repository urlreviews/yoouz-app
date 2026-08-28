const fs = require('fs');
let code = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

const target = `  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onToggleMute(e);
    
    if (muteFeedbackTimeoutRef.current) clearTimeout(muteFeedbackTimeoutRef.current);`;

const replace = `  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (browserForcedMute && !isMuted) {
      // The user wants to unmute this specific video that the browser forced muted.
      // But globally it's already "unmuted". We just need to fix the local state.
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
      }
      setBrowserForcedMute(false);
    } else {
      // Normal toggle
      onToggleMute(e);
    }
    
    if (muteFeedbackTimeoutRef.current) clearTimeout(muteFeedbackTimeoutRef.current);`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/VideoFeedCard.tsx', code, 'utf-8');
console.log("Updated handleToggleMute");
