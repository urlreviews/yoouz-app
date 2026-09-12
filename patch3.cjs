const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

code = code.replace('{embedLayout.toUpperCase()}', 'GRID');
code = code.replace('className="lg:col-span-2 bg-zinc-950 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between"', 'className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between"');

// We also need to change the background of the widget simulation container to dark mode.
code = code.replace('bg-white border-[8px] border-zinc-950 rounded-[44px] px-3.5 py-4 shadow-2xl relative my-2 overflow-hidden transition-all"', 'bg-zinc-950 border-[8px] border-zinc-800 rounded-[44px] px-3.5 py-4 shadow-2xl relative my-2 overflow-hidden transition-all ring-1 ring-zinc-700/50"');
code = code.replace('widget-simulation-container p-8 rounded-3xl border border-zinc-800 bg-white shadow-xl transition-all"', 'widget-simulation-container p-6 rounded-3xl border border-zinc-800 bg-zinc-900 text-white shadow-xl transition-all"');

// Fix the mobile notch and status bar colors to be dark mode compliant
code = code.replace('className="mb-3 px-2 flex items-center justify-between text-[11px] font-semibold text-zinc-800 select-none"', 'className="mb-3 px-2 flex items-center justify-between text-[11px] font-semibold text-zinc-400 select-none"');
code = code.replace('className="w-24 h-5 bg-black mx-auto rounded-full flex items-center justify-center gap-1.5 px-2"', 'className="w-24 h-5 bg-zinc-900 mx-auto rounded-full flex items-center justify-center gap-1.5 px-2 border border-zinc-800"');
code = code.replace('className="w-2.5 h-2.5 rounded-full bg-zinc-900"', 'className="w-2.5 h-2.5 rounded-full bg-zinc-950"');
code = code.replace('className="w-2 h-2 rounded-full bg-zinc-800 animate-pulse"', 'className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse"');
code = code.replace('className="flex items-center gap-1 text-[10px] text-zinc-900"', 'className="flex items-center gap-1 text-[10px]"');
code = code.replace('className="w-4 h-2.5 border border-zinc-900 rounded-xs p-0.5 flex items-center"', 'className="w-4 h-2.5 border border-zinc-400 rounded-xs p-0.5 flex items-center"');
code = code.replace('className="w-full h-full bg-zinc-900 rounded-2xs"', 'className="w-full h-full bg-zinc-400 rounded-2xs"');

// Fix Trust Header
code = code.replace('{embedShowTrustHeader && (', '{true && (');
code = code.replace('border-zinc-100 bg-zinc-50 text-zinc-900 flex flex-col', 'border-zinc-700/80 bg-zinc-800/90 text-white flex flex-col');

fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
console.log("Success patch3");
