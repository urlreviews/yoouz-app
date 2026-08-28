const fs = require('fs');
let content = fs.readFileSync('src/components/CopoMobileSearchView.tsx', 'utf8');

const oldLogo = `className="w-14 h-14 rounded-2xl border-2 border-zinc-700 bg-zinc-800 shadow-lg overflow-hidden p-0.5 flex items-center justify-center ring-1 ring-white/20"`;
const newLogo = `className="w-16 h-16 sm:w-20 sm:h-20 -mt-8 mb-2 rounded-2xl border-4 border-zinc-900 bg-white shadow-xl overflow-hidden p-1.5 flex items-center justify-center relative z-20 ring-1 ring-black/20"`;

content = content.replace(oldLogo, newLogo);

fs.writeFileSync('src/components/CopoMobileSearchView.tsx', content);
