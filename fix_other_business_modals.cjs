const fs = require('fs');

const files = [
  './src/components/CopoBusinessClaimModal.tsx',
  './src/components/CopoBusinessPricingModal.tsx',
  './src/components/CopoCreemCheckoutModal.tsx'
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/bg-white/g, 'bg-zinc-900');
  content = content.replace(/bg-zinc-50/g, 'bg-zinc-950');
  content = content.replace(/bg-zinc-100/g, 'bg-zinc-800');
  content = content.replace(/bg-zinc-200/g, 'bg-zinc-800');
  
  content = content.replace(/text-zinc-900/g, 'text-white');
  content = content.replace(/text-zinc-800/g, 'text-zinc-200');
  content = content.replace(/text-zinc-700/g, 'text-zinc-300');
  content = content.replace(/text-zinc-600/g, 'text-zinc-400');
  
  content = content.replace(/border-zinc-200/g, 'border-zinc-800');
  content = content.replace(/border-zinc-300/g, 'border-zinc-700');
  content = content.replace(/border-zinc-100/g, 'border-zinc-800');

  // specific
  content = content.replace(/bg-blue-50/g, 'bg-blue-900/30');
  content = content.replace(/bg-emerald-50/g, 'bg-emerald-900/30');
  
  content = content.replace(/text-\[#1a73e8\]/g, 'text-blue-400');
  
  content = content.replace(/hover:bg-zinc-50/g, 'hover:bg-zinc-800');
  content = content.replace(/hover:bg-zinc-100/g, 'hover:bg-zinc-800');

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed other business modals');
