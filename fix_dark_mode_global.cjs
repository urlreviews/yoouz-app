const fs = require('fs');
const glob = require('glob'); // Note: we can just use fs.readdirSync recursively or pass specific files.

const files = [
  './src/components/CopoBusinessDashboardView.tsx',
  './src/components/CountrySelector.tsx',
  './src/components/SearchableComboSelector.tsx',
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix CountrySelector & SearchableComboSelector
  content = content.replace(/bg-zinc-50\/50/g, 'bg-zinc-950/50');
  content = content.replace(/bg-zinc-50/g, 'bg-zinc-950');
  content = content.replace(/bg-zinc-100\/50/g, 'bg-zinc-900/50');
  content = content.replace(/bg-zinc-100/g, 'bg-zinc-900');
  content = content.replace(/bg-white/g, 'bg-zinc-950');
  
  content = content.replace(/border-zinc-200/g, 'border-zinc-800');
  content = content.replace(/border-zinc-300/g, 'border-zinc-700');
  content = content.replace(/border-zinc-100/g, 'border-zinc-800');
  
  content = content.replace(/text-zinc-800/g, 'text-zinc-200');
  content = content.replace(/text-zinc-700/g, 'text-zinc-300');
  content = content.replace(/text-zinc-600/g, 'text-zinc-400');
  // Avoid replacing text-zinc-400 if it's already 400
  // text-zinc-500 is ok.
  
  content = content.replace(/hover:bg-zinc-50/g, 'hover:bg-zinc-900');
  content = content.replace(/hover:text-zinc-600/g, 'hover:text-zinc-200');
  content = content.replace(/bg-blue-50/g, 'bg-blue-950/50');

  // Fix md:bg-white to md:bg-zinc-950
  content = content.replace(/md:bg-white/g, 'md:bg-zinc-950');

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed additional files');
