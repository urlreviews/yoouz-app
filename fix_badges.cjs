const fs = require('fs');

const files = [
  './src/components/CopoBusinessDashboardView.tsx',
  './src/components/CopoBusinessAuthLanding.tsx'
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/bg-blue-100(\/[0-9]+)?/g, 'bg-blue-900/30');
  content = content.replace(/text-\[#1a73e8\]/g, 'text-blue-400');
  
  content = content.replace(/bg-emerald-100(\/[0-9]+)?/g, 'bg-emerald-900/30');
  content = content.replace(/bg-emerald-500\/10/g, 'bg-emerald-900/30');
  content = content.replace(/text-emerald-700/g, 'text-emerald-400');
  
  content = content.replace(/bg-amber-100(\/[0-9]+)?/g, 'bg-amber-900/30');
  content = content.replace(/text-amber-700/g, 'text-amber-400');
  
  // also update hover:bg-blue-50
  content = content.replace(/hover:bg-blue-50/g, 'hover:bg-blue-900/30');

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed badges');
