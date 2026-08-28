const fs = require('fs');
let content = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf8');

content = content.replace(
  /className="w-9 h-9 rounded-lg bg-white border border-white\/40 overflow-hidden flex items-center justify-center shrink-0 p-0.5 shadow-sm group-hover:scale-105 transition-transform"/g,
  'className="w-9 h-9 rounded-lg bg-white border border-white/40 overflow-hidden flex items-center justify-center shrink-0 p-1 shadow-sm group-hover:scale-105 transition-transform"'
);

fs.writeFileSync('src/components/VideoFeedCard.tsx', content);
