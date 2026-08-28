const fs = require('fs');
let file = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

file = file.replace(
  /activeEl\.muted = true;\s*activeEl\.play\(\)\.then\(\(\) => \{\s*setIsPlaying\(true\);\s*setIsMuted\(true\);\s*\}\)\.catch\(\(\) => \{\s*setIsPlaying\(false\);\s*\}\);/g,
  `setIsPlaying(false);`
);

file = file.replace(
  /target\.muted = true;\s*target\.play\(\)\.catch\(\(\) => \{\}\);/g,
  `setIsPlaying(false);`
);

file = file.replace(
  /activeEl\.muted = true;\s*activeEl\.play\(\)\.catch\(\(\) => \{\}\);/g,
  `setIsPlaying(false);`
);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', file);
