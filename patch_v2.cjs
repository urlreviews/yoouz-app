const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix Venue Header Wrap
content = content.replace(
  /<div className="flex items-center gap-3 mb-2 w-full overflow-hidden">\s*<h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none truncate min-w-0">\{currentPlace\.name\}<\/h1>\s*<div className="flex items-center gap-1\.5 px-2\.5 py-1 rounded-full bg-emerald-500\/10 border border-emerald-500\/20 text-emerald-400 text-\[10px\] font-bold uppercase tracking-wider shadow-\[0_0_10px_rgba\(16,185,129,0\.1\)\] shrink-0 whitespace-nowrap">/g,
  `<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 w-full">
                      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none break-words">{currentPlace.name}</h1>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)] self-start sm:self-auto shrink-0 whitespace-nowrap">`
);

// 2. Fix Chart Header Wrap
content = content.replace(
  /<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">\s*<h3 className="text-sm md:text-base font-bold text-white truncate min-w-0">([\s\S]*?)<\/h3>\s*<span className="text-\[11px\] font-bold text-emerald-400 bg-emerald-500\/10 px-2\.5 py-1 rounded-full border border-emerald-500\/20 shadow-\[0_0_10px_rgba\(16,185,129,0\.1\)\] flex items-center gap-1 shrink-0 whitespace-nowrap">/g,
  `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                            <h3 className="text-sm md:text-base font-bold text-white leading-tight">$1</h3>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] flex items-center gap-1 self-start sm:self-auto shrink-0 whitespace-nowrap">`
);

// 3. Fix Recent Videos Header Wrap
content = content.replace(
  /<div className="flex items-start sm:items-center justify-between gap-4 mb-5">\s*<div className="min-w-0 flex-1">\s*<h3 className="text-lg font-bold text-white truncate">Recent Customer Video Reviews<\/h3>\s*<p className="text-xs text-zinc-400 mt-1 truncate">Verified diners who filmed 60-second reviews at your venue<\/p>\s*<\/div>/g,
  `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white leading-tight">Recent Customer Video Reviews</h3>
                      <p className="text-xs text-zinc-400 mt-1">Verified diners who filmed 60-second reviews at your venue</p>
                    </div>`
);

// 4. Fix Video Play Button (Absolutely Centered) & Bottom Padding
content = content.replace(
  /<div className="self-center w-10 h-10 rounded-full bg-white\/20 backdrop-blur-md border border-white\/30 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">\s*<Play className="w-4 h-4 fill-current ml-0\.5" \/>\s*<\/div>/g,
  `<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300 z-10">
                                <Play className="w-5 h-5 fill-current ml-1" />
                              </div>`
);

content = content.replace(
  /<div className="flex items-center justify-between pt-3 pb-1 px-2 border-t border-white\/\[0\.04\] mt-3">/g,
  `<div className="flex items-center justify-between pt-4 pb-3 px-3 border-t border-white/[0.04] mt-3">`
);

fs.writeFileSync(file, content);
console.log('Fixed UI issues.');
