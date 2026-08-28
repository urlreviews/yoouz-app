const fs = require('fs');
let file = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

file = file.replace(
  /className="relative z-20 flex items-center justify-between px-4 pt-safe mt-2 md:pt-4 md:mt-0 pb-2"/g,
  'className="relative z-20 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,16px)+12px)] md:pt-4 pb-2"'
);

file = file.replace(
  /className="relative z-20 px-4 pb-3 pt-6 flex flex-col gap-3"/g,
  'className="relative z-20 px-4 pb-[calc(env(safe-area-inset-bottom,16px)+24px)] md:pb-6 pt-6 flex flex-col gap-3"'
);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', file);
