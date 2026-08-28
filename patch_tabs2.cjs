const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetTabs = `<div className="flex items-center gap-1 bg-zinc-950 md:bg-zinc-900 p-1 rounded-xl border border-zinc-800 md:border-zinc-800/80 self-start sm:self-auto w-full sm:w-auto overflow-x-auto no-scrollbar">`;
const replaceTabs = `<div className="flex flex-wrap items-center gap-1 bg-zinc-950 md:bg-zinc-900 p-1 rounded-xl border border-zinc-800 md:border-zinc-800/80 self-start sm:self-auto w-full sm:w-auto">`;

content = content.replace(targetTabs, replaceTabs);
fs.writeFileSync(file, content);
console.log('Patched tabs wrap');
