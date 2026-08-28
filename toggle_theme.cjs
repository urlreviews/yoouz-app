const fs = require('fs');
let content = fs.readFileSync('src/components/CopoAdminPanel.tsx', 'utf8');

const replacements = [
  [/bg-zinc-950/g, 'bg-zinc-50'],
  [/bg-zinc-900/g, 'bg-white'],
  [/bg-zinc-800/g, 'bg-zinc-100'],
  [/bg-zinc-700/g, 'bg-zinc-200'],
  [/text-white/g, 'text-zinc-900'],
  [/text-zinc-100/g, 'text-zinc-800'],
  [/text-zinc-200/g, 'text-zinc-700'],
  [/text-zinc-300/g, 'text-zinc-600'],
  [/text-zinc-400/g, 'text-zinc-500'],
  [/text-zinc-500/g, 'text-zinc-400'],
  [/border-zinc-800/g, 'border-zinc-200'],
  [/border-zinc-700/g, 'border-zinc-300'],
  [/divide-zinc-800/g, 'divide-zinc-200'],
  [/divide-zinc-700/g, 'divide-zinc-300'],
  [/text-emerald-400/g, 'text-emerald-600'],
  [/text-blue-400/g, 'text-blue-600'],
  [/text-purple-400/g, 'text-purple-600'],
  [/text-rose-400/g, 'text-rose-600'],
  [/text-amber-400/g, 'text-amber-600'],
  [/text-emerald-300/g, 'text-emerald-700'],
  [/text-blue-300/g, 'text-blue-700'],
  [/text-purple-300/g, 'text-purple-700'],
  [/text-rose-300/g, 'text-rose-700'],
  [/text-amber-300/g, 'text-amber-700'],
  [/bg-emerald-500\/20/g, 'bg-emerald-100'],
  [/bg-blue-500\/20/g, 'bg-blue-100'],
  [/bg-purple-500\/20/g, 'bg-purple-100'],
  [/bg-rose-500\/20/g, 'bg-rose-100'],
  [/bg-amber-500\/20/g, 'bg-amber-100'],
  [/border-emerald-500\/30/g, 'border-emerald-200'],
  [/border-blue-500\/30/g, 'border-blue-200'],
  [/border-purple-500\/30/g, 'border-purple-200'],
  [/border-rose-500\/30/g, 'border-rose-200'],
  [/border-amber-500\/30/g, 'border-amber-200'],
  [/ring-zinc-800/g, 'ring-zinc-200'],
  [/shadow-black\/50/g, 'shadow-zinc-200/50'],
  [/shadow-black\/40/g, 'shadow-zinc-200/40'],
  [/shadow-xl/g, 'shadow-md'],
  [/bg-black\/80/g, 'bg-zinc-900/40'], // modal backdrop
];

replacements.forEach(([regex, replacement]) => {
  content = content.replace(regex, replacement);
});

fs.writeFileSync('src/components/CopoAdminPanel.tsx', content);
