const fs = require('fs');
let file = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

file = file.replace(
  /activeEl\.muted = true;\s*activeEl\.play\(\)\.catch\(\(\) => \{\}\);\s*setIsMuted\(true\);/g,
  `setIsPlaying(false);`
);

// We need to also patch other play().catch() blocks just in case they override setIsMuted
file = file.replace(
  /activeEl\.muted = true;\s*activeEl\.play\(\)\.then\(\(\) => setIsPlaying\(true\)\)\.catch\(\(\) => \{\}\);/g,
  `setIsPlaying(false);`
);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', file);
