const fs = require('fs');

const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const kpiRegex = /\{\/\* 4 Google-Style KPI Cards with Micro-Sparklines \*\/\}.*?\{\/\* Interactive Performance Graph & Engagement Breakdown \*\/\}/s;

const newKpiBlock = `{/* 4 Premium Glass KPI Cards with Micro-Sparklines */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { key: 'views' as const, label: 'Video Profile Impressions', value: '38,550', change: '+24.6%', icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { key: 'clicks' as const, label: 'CTA / Booking Clicks', value: '1,480', change: '+18.2%', icon: MousePointerClick, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { key: 'reviews' as const, label: 'Verified Video Reviews', value: placeVideos.length.toString(), change: '+3 new', icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { key: 'inquiries' as const, label: 'Overall Rating', value: '4.9 ★', change: 'Top 2% NYC', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  ].map((stat, i) => {
                    const isSelected = selectedChartMetric === stat.key;
                    // Sparklines simplified for visual cleanliness, utilizing an SVG line with glow
                    const sparklineColor = stat.key === 'views' ? '#60a5fa' : stat.key === 'clicks' ? '#34d399' : stat.key === 'reviews' ? '#c084fc' : '#fbbf24';
                    return (
                      <div 
                         key={i} 
                         onClick={() => setSelectedChartMetric(stat.key)}
                        className={\`bg-[#0a0a0c] rounded-[24px] border p-4 md:p-5 shadow-inner shadow-white/[0.02] flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group \${
                          isSelected 
                             ? 'border-[#1a73e8]/40 ring-1 ring-[#1a73e8]/20 bg-[#1a73e8]/[0.02]' 
                             : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                        }\`}
                      >
                        {/* Soft subtle glow behind icon */}
                        <div className={\`absolute top-0 left-0 w-24 h-24 blur-3xl opacity-20 pointer-events-none rounded-full \${stat.bg.replace('/10', '')}\`} />
                        
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className={\`w-9 h-9 rounded-xl \${stat.bg} \${stat.color} flex items-center justify-center border border-white/[0.04] shadow-inner shadow-white/[0.05]\`}>
                            <stat.icon className="w-4 h-4" />
                          </div>
                          <span className={\`flex items-center gap-1 text-[10px] font-extrabold \${stat.color} \${stat.bg} px-2 py-0.5 rounded-full border border-white/[0.04]\`}>
                            <TrendingUp className="w-2.5 h-2.5" /> {stat.change}
                          </span>
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-end justify-between mb-1">
                            <div className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none">{stat.value}</div>
                            {/* SVG Mini Sparkline */}
                            <svg className="w-12 h-5 overflow-visible opacity-80" viewBox="0 0 60 20">
                              <polyline
                                fill="none"
                                stroke={sparklineColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={stat.key === 'views' ? '0,15 15,12 30,14 45,8 60,4' : stat.key === 'clicks' ? '0,16 20,15 40,12 60,6' : stat.key === 'reviews' ? '0,18 15,18 30,12 45,15 60,5' : '0,5 20,5 40,5 60,5'}
                                className="drop-shadow-[0_2px_4px_rgba(255,255,255,0.1)]"
                              />
                            </svg>
                          </div>
                          <div className="text-[11px] font-medium text-zinc-400 mt-1">{stat.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Interactive Performance Graph & Engagement Breakdown */}`;

content = content.replace(kpiRegex, newKpiBlock);
fs.writeFileSync(file, content);
console.log('KPI patched.');
