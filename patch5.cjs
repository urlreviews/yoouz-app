const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const strStart = '{/* Video Simulation Display according to embedLayout */}';
const strEnd = '{embedDeviceMode === \'mobile\' && (';

let startIndex = code.indexOf(strStart);
let endIndex = code.indexOf(strEnd, startIndex);

if (startIndex > -1 && endIndex > -1) {
  let newBlock = `{/* Video Simulation Display (GRID MODE ONLY) */}
                          {displayableWidgetVideos.length === 0 ? (
                            <div className="py-12 text-center text-zinc-400 space-y-2">
                              <AlertCircle className="w-8 h-8 mx-auto text-zinc-500" />
                              <p className="text-xs font-semibold text-zinc-300">No video reviews pinned or found.</p>
                            </div>
                          ) : (
                            /* 3-COLUMN REEL GRID PREVIEW */
                            <div className={\`grid \${embedDeviceMode === 'mobile' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2.5\`}>
                              {displayableWidgetVideos.map((v) => {
                                const isPinned = pinnedVideoIds.includes(v.id);
                                return (
                                  <div 
                                    key={v.id} 
                                    onClick={() => setActiveVideoModal(v)}
                                    className="relative rounded-2xl overflow-hidden aspect-9/14 bg-zinc-800 group shadow-xs cursor-pointer hover:scale-[1.02] transition-transform"
                                    title="Click to play video reel"
                                  >
                                    <img
                                      src={v.thumbnailUrl}
                                      alt={v.dishOrItem || 'Review'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                    
                                    {isPinned && (
                                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-white text-zinc-950 text-[9px] font-black shadow-md flex items-center gap-0.5 z-10">
                                        <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                                      </div>
                                    )}

                                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-0.5 z-10">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                      <span>{v.rating || 5}</span>
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                                      <span className="text-[10px] font-bold leading-tight line-clamp-1">
                                        {v.dishOrItem && v.dishOrItem !== selectedPlaceId ? v.dishOrItem : (v.author?.name || 'Customer')}
                                      </span>
                                    </div>

                                    <div 
                                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          `;

  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
  console.log("Success patch5");
} else {
  console.log("Failed to find bounds patch5");
}
