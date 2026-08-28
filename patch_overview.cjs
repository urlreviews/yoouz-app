const fs = require('fs');

const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const bannerRegex = /\{\/\* Banner with Welcome & Date Filter \*\/\}.*?(?=\{\/\* 4 Google-Style KPI Cards)/s;
const bannerReplacement = `{/* Banner with Welcome & Date Filter */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">{currentPlace.name}</h1>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        CLAIMED & VERIFIED
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">
                      Real-time performance metrics driven by customer video reviews across the Yoouz network.
                    </p>
                  </div>
                  {/* Date Filter Pills */}
                  <div className="flex items-center bg-[#0a0a0c] p-1 rounded-2xl border border-white/[0.06] w-full sm:w-auto justify-between sm:justify-start shadow-inner shadow-white/[0.02]">
                    {(['7d', '30d', '90d', 'ytd'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setAnalyticsDateRange(range)}
                        className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                          analyticsDateRange === range ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                        }\`}
                      >
                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                      </button>
                    ))}
                  </div>
                </div>
                `;

content = content.replace(bannerRegex, bannerReplacement);
fs.writeFileSync(file, content);
console.log('Banner patched.');
