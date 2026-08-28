const fs = require('fs');
let file = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

file = file.replace(
  /className="absolute right-3 bottom-14 z-25 flex flex-col items-center gap-4\.5 text-white"/g,
  'className="absolute right-3 bottom-[calc(env(safe-area-inset-bottom,16px)+140px)] md:bottom-28 z-25 flex flex-col items-center gap-4.5 text-white"'
);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', file);
