const fs = require('fs');

const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix Banner Title & Claimed Badge Wrapping
content = content.replace(
  /<div className="flex items-center gap-3 mb-2">([\s\S]*?)<h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">(.*?)<\/h1>([\s\S]*?)<div className="flex items-center gap-1\.5 px-2\.5 py-1 rounded-full bg-emerald-500\/10 border border-emerald-500\/20 text-emerald-400 text-\[10px\] font-bold uppercase tracking-wider shadow-\[0_0_10px_rgba\(16,185,129,0\.1\)\]">/g,
  `<div className="flex items-center gap-3 mb-2 w-full overflow-hidden">
                      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none truncate min-w-0">$2</h1>$3<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)] shrink-0 whitespace-nowrap">`
);

// 2. Fix KPI Card Sparkline Badge Wrapping
content = content.replace(
  /<span className=\{`flex items-center gap-1 text-\[10px\] font-extrabold \$\{stat\.color\} \$\{stat\.bg\} px-2 py-0\.5 rounded-full border border-white\/\[0\.04\]`\}>/g,
  `<span className={\`flex items-center gap-1 text-[10px] font-extrabold \${stat.color} \${stat.bg} px-2 py-0.5 rounded-full border border-white/[0.04] shrink-0 whitespace-nowrap\`}>`
);

// 3. Fix Chart Header Badge Wrapping
content = content.replace(
  /<div className="flex items-center gap-2">\s*<h3 className="text-sm md:text-base font-bold text-white md:text-white">([\s\S]*?)<\/h3>\s*<span className="text-\[11px\] font-bold text-emerald-400 bg-emerald-500\/10 px-2\.5 py-1 rounded-full border border-emerald-500\/20 shadow-\[0_0_10px_rgba\(16,185,129,0\.1\)\] flex items-center gap-1">([\s\S]*?)<TrendingUp className="w-3 h-3" \/>(.*?)<\/span>\s*<\/div>/g,
  `<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
                            <h3 className="text-sm md:text-base font-bold text-white truncate min-w-0">$1</h3>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] flex items-center gap-1 shrink-0 whitespace-nowrap">$2<TrendingUp className="w-3 h-3 shrink-0" />$3</span>
                          </div>`
);

// 4. Fix Video Review Header Manage All button Wrapping
content = content.replace(
  /<div className="flex items-center justify-between mb-5">\s*<div>\s*<h3 className="text-lg font-bold text-white">Recent Customer Video Reviews<\/h3>\s*<p className="text-xs text-zinc-400 mt-1">Verified diners who filmed 60-second reviews at your venue<\/p>\s*<\/div>\s*<button/g,
  `<div className="flex items-start sm:items-center justify-between gap-4 mb-5">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-white truncate">Recent Customer Video Reviews</h3>
                      <p className="text-xs text-zinc-400 mt-1 truncate">Verified diners who filmed 60-second reviews at your venue</p>
                    </div>
                    <button`
);

content = content.replace(
  /className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"\s*>/g,
  `className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                    >`
);

fs.writeFileSync(file, content);
console.log('Wrapping issues fixed.');
