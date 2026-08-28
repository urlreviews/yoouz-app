const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

const target = `    if (el.paused) {
      el.muted = isMuted; // enforce current mute setting synchronously
      const p = el.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn("Play block:", err);
          el.muted = true;
          el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      }
      triggerFeedback("play");
    } else {`;

const replacement = `    if (el.paused) {
      el.muted = isMuted; // enforce current mute setting synchronously
      const p = el.play();
      if (isActive) setIsPlaying(true);
      if (p !== undefined) {
        p.then(() => {
          if (isActive) setIsPlaying(true);
        }).catch((err) => {
          if (err.name === "AbortError") return;
          console.warn("Play block:", err);
          el.muted = true;
          if (isActive) setIsPlaying(true);
          el.play().then(() => { if (isActive) setIsPlaying(true); }).catch((e) => {
            if (e.name !== "AbortError" && isActive) setIsPlaying(false);
          });
        });
      }
      triggerFeedback("play");
    } else {`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/VideoFeedCard.tsx', content, 'utf-8');
console.log("Updated toggle play pause");
