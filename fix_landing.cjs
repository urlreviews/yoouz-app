const fs = require('fs');

const filePath = './src/components/CopoBusinessAuthLanding.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/bg-\[#fafbfd\]/g, 'bg-zinc-950');
content = content.replace(/bg-white/g, 'bg-zinc-900');
content = content.replace(/bg-zinc-50/g, 'bg-zinc-950');
content = content.replace(/bg-zinc-100/g, 'bg-zinc-800');

content = content.replace(/text-zinc-900/g, 'text-white');
content = content.replace(/text-zinc-800/g, 'text-zinc-200');
content = content.replace(/text-zinc-700/g, 'text-zinc-300');
content = content.replace(/text-zinc-600/g, 'text-zinc-400');
content = content.replace(/text-zinc-500/g, 'text-zinc-400');

content = content.replace(/border-zinc-200/g, 'border-zinc-800');
content = content.replace(/border-zinc-300/g, 'border-zinc-700');
content = content.replace(/border-zinc-100/g, 'border-zinc-800');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed CopoBusinessAuthLanding.tsx');
