const fs = require('fs');

const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const chartStart = /\{\/\* Left: Interactive SVG Area & Curve Chart \(Google Search Console & Cloud Style\) \*\/\}/s;
const actionCardsStart = /\{\/\* Right: Quick Action Cards \*\/\}/s;
const feedPreviewStart = /\{\/\* Top Video Reviews Feed Preview \*\/\}/s;

const beforeChart = content.substring(0, content.search(chartStart));
const chartSection = content.substring(content.search(chartStart), content.search(actionCardsStart));
const feedSectionAndRest = content.substring(content.search(feedPreviewStart));

// I need to update the background of the chart section
const updatedChartSection = chartSection.replace(
  /bg-zinc-900\/90 md:bg-zinc-900 rounded-3xl border border-zinc-800 text-white border border-zinc-800 md:border-zinc-800\/80 p-5 md:p-6 shadow-xs/g,
  'bg-[#0a0a0c] rounded-3xl border border-white/[0.06] text-white p-5 md:p-6 shadow-inner shadow-white/[0.02]'
).replace(
  /bg-emerald-900\/300\/10 md:bg-emerald-900\/30 px-2 py-0.5 rounded-full border border-emerald-500\/20 md:border-emerald-100/g,
  'bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
).replace(
  /bg-zinc-950 md:bg-zinc-900 p-1 rounded-xl border border-zinc-800 md:border-zinc-800\/70/g,
  'bg-[#050505] p-1 rounded-2xl border border-white/[0.06] shadow-inner shadow-white/[0.02]'
).replace(
  /bg-zinc-800 md:bg-zinc-950 text-white md:text-blue-400 shadow-2xs font-black/g,
  'bg-zinc-800 text-white shadow-md font-bold'
);

const actionCardsBlock = `{/* Right: Quick Action Cards */}
                  <div className="space-y-4">
                    {/* QR Stand Card */}
                    <div className="bg-[#0a0a0c] border border-white/[0.06] rounded-3xl p-6 text-white shadow-inner shadow-white/[0.02] relative overflow-hidden group">
                      {/* Glow effect */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-600/30 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-500/40 transition-colors duration-500" />
                      
                      <div className="relative z-10">
                        <Sparkles className="w-6 h-6 text-blue-400 mb-3" />
                        <h4 className="font-extrabold text-lg mb-1">Increase Video Reviews</h4>
                        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                          Venues with QR standees on tables collect 4.2x more customer video reviews every week.
                        </p>
                        <button
                          onClick={() => setActiveTab('qr_invites')}
                          className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.03)] cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          Print QR Table Stands
                        </button>
                      </div>
                    </div>
                    
                    {/* Embed Widget Card */}
                    <div className="bg-[#0a0a0c] border border-white/[0.06] rounded-3xl p-6 text-white shadow-inner shadow-white/[0.02] relative overflow-hidden group">
                      {/* Glow effect */}
                      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-600/20 blur-3xl rounded-full pointer-events-none group-hover:bg-purple-500/30 transition-colors duration-500" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
                          <Code className="w-4 h-4 text-purple-400" />
                          <span>Embed On Your Site</span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                          Add the official Yoouz video carousel to your homepage in under 60 seconds.
                        </p>
                        <button
                          onClick={() => setActiveTab('embed')}
                          className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Configure Embed Widget
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                `;

fs.writeFileSync(file, beforeChart + updatedChartSection + actionCardsBlock + feedSectionAndRest);
console.log('Chart and Action cards patched.');
