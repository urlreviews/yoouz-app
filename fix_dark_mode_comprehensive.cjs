const fs = require('fs');

const files = [
  './src/components/CopoBusinessDashboardView.tsx',
  './src/components/CountrySelector.tsx',
  './src/components/SearchableComboSelector.tsx',
  './src/components/CopoBusinessAuthLanding.tsx'
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/bg-\[#f8fafd\]/g, 'bg-zinc-950');
  content = content.replace(/bg-\[#f8f9fa\]/g, 'bg-zinc-950');
  content = content.replace(/md:bg-\[#f8f9fa\]/g, 'md:bg-zinc-950');
  content = content.replace(/md:bg-\[#f8fafd\]/g, 'md:bg-zinc-950');
  content = content.replace(/bg-\[#e8f0fe\]/g, 'bg-blue-900/30');
  content = content.replace(/text-blue-600/g, 'text-blue-400');
  
  content = content.replace(/border-blue-100/g, 'border-blue-900/50');
  content = content.replace(/border-blue-200/g, 'border-blue-900/50');
  content = content.replace(/divide-zinc-100/g, 'divide-zinc-800');
  content = content.replace(/bg-emerald-50/g, 'bg-emerald-500/10');
  content = content.replace(/text-emerald-700/g, 'text-emerald-400');
  
  // Any remaining light zincs
  content = content.replace(/bg-zinc-50/g, 'bg-zinc-950');
  content = content.replace(/bg-zinc-100/g, 'bg-zinc-900');
  content = content.replace(/bg-zinc-200/g, 'bg-zinc-800');
  
  content = content.replace(/text-zinc-900/g, 'text-white');
  content = content.replace(/text-zinc-800/g, 'text-zinc-200');
  content = content.replace(/text-zinc-700/g, 'text-zinc-300');
  content = content.replace(/text-zinc-600/g, 'text-zinc-400');
  
  content = content.replace(/border-zinc-200/g, 'border-zinc-800');
  content = content.replace(/border-zinc-300/g, 'border-zinc-700');
  content = content.replace(/border-zinc-100/g, 'border-zinc-800');
  
  content = content.replace(/hover:bg-zinc-50/g, 'hover:bg-zinc-900');
  content = content.replace(/hover:bg-zinc-100/g, 'hover:bg-zinc-800');
  content = content.replace(/hover:text-zinc-600/g, 'hover:text-zinc-300');
  content = content.replace(/hover:text-zinc-700/g, 'hover:text-zinc-200');

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed comprehensive dark mode');
