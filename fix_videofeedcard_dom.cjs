const fs = require('fs');
let code = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

const target = `      {/* HTML5 Video Tag with TikTok/Reels preloading attributes */}
      {(isActive || isNear) && resolvedSource ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          <video
            ref={videoRef}
            src={resolvedSource}
            poster={cleanThumbnail || undefined}
            loop
            playsInline
            autoPlay={isActive}
            muted={isMuted}
            preload={isActive ? "auto" : "metadata"}`;

const replace = `      {/* HTML5 Video Tag with TikTok/Reels preloading attributes */}
      {resolvedSource ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          <video
            ref={videoRef}
            src={resolvedSource}
            poster={cleanThumbnail || undefined}
            loop
            playsInline
            autoPlay={isActive}
            muted={isMuted}
            preload={isActive ? "auto" : (isNear ? "metadata" : "none")}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/VideoFeedCard.tsx', code, 'utf-8');
console.log("Fixed VideoFeedCard DOM retention for Safari autoplay");
