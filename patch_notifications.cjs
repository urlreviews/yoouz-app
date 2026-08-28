const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                {showNotificationsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-900 md:bg-zinc-950 rounded-2xl border border-zinc-800 text-white shadow-xl border border-zinc-800 md:border-zinc-800 py-2 z-50 animate-in fade-in text-zinc-200 md:text-white">`;

const replaceStr = `                {showNotificationsDropdown && (
                  <div className="absolute top-full -right-16 sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-[360px] bg-zinc-900 rounded-2xl border border-zinc-800 text-white shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync(file, content);
console.log('Patched');
