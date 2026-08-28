import fs from 'fs';

const filePath = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard white container cards with dark obsidian cards
content = content.replace(/bg-white rounded-3xl border border-zinc-200\/80/g, 'bg-zinc-900 rounded-3xl border border-zinc-800 text-white');
content = content.replace(/bg-white rounded-3xl border border-zinc-200/g, 'bg-zinc-900 rounded-3xl border border-zinc-800 text-white');
content = content.replace(/bg-white rounded-3xl/g, 'bg-zinc-900 rounded-3xl border border-zinc-800 text-white');

// Replace standard white boxes
content = content.replace(/bg-white rounded-2xl border border-zinc-200/g, 'bg-zinc-950 rounded-2xl border border-zinc-800 text-white');
content = content.replace(/bg-white rounded-2xl/g, 'bg-zinc-950 rounded-2xl border border-zinc-800 text-white');
content = content.replace(/bg-white rounded-xl border border-zinc-200/g, 'bg-zinc-950 rounded-xl border border-zinc-800 text-white');
content = content.replace(/bg-white p-3 rounded-xl border border-zinc-100/g, 'bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-white');
content = content.replace(/bg-white p-3\.5 rounded-2xl shadow-lg border border-zinc-200/g, 'bg-zinc-950 p-3.5 rounded-2xl shadow-lg border border-zinc-800 text-white');

// Replace generic bg-white in forms and modals
content = content.replace(/bg-white border border-zinc-300/g, 'bg-zinc-950 border border-zinc-800 text-white');
content = content.replace(/bg-white border border-zinc-200/g, 'bg-zinc-950 border border-zinc-800 text-white');
content = content.replace(/bg-white p-6 max-w-md w-full/g, 'bg-zinc-900 text-white rounded-3xl p-6 max-w-md w-full border border-zinc-800');
content = content.replace(/bg-white rounded-3xl p-6 max-w-lg/g, 'bg-zinc-900 text-white rounded-3xl p-6 max-w-lg border border-zinc-800');
content = content.replace(/bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden/g, 'bg-zinc-900 text-white rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden');

// Replace zinc-50 / zinc-100 background utility inputs
content = content.replace(/bg-zinc-50 border border-zinc-200/g, 'bg-zinc-950 border border-zinc-800 text-white');
content = content.replace(/bg-zinc-50/g, 'bg-zinc-950 text-white');
content = content.replace(/bg-zinc-100/g, 'bg-zinc-900 text-white border border-zinc-800');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Dark mode classes applied successfully.');
