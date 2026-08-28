const fs = require('fs');
let content = fs.readFileSync('src/components/CopoMobileSearchView.tsx', 'utf8');

content = content.replace(
  `className="w-16 h-16 sm:w-20 sm:h-20 -mt-8 mb-2 rounded-2xl border-4 border-zinc-900 bg-white shadow-xl overflow-hidden p-1.5 flex items-center justify-center relative z-20 ring-1 ring-black/20"`,
  `className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-zinc-900 bg-white shadow-xl overflow-hidden p-1.5 flex items-center justify-center relative ring-1 ring-black/20"`
);

fs.writeFileSync('src/components/CopoMobileSearchView.tsx', content);
