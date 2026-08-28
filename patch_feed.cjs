const fs = require('fs');

const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const feedPreviewStart = /\{\/\* Top Video Reviews Feed Preview \*\/\}/s;
const tab2Start = /\{\/\* TAB 2: VIDEO REVIEWS \& MODERATION \*\/\}/s;

const beforeFeed = content.substring(0, content.search(feedPreviewStart));
const afterFeed = content.substring(content.search(tab2Start));

const newFeed = `{/* Top Video Reviews Feed Preview */}
                <div className="bg-[#0a0a0c] rounded-3xl border border-white/[0.06] text-white p-6 shadow-inner shadow-white/[0.02]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-white">Recent Customer Video Reviews</h3>
                      <p className="text-xs text-zinc-400 mt-1">Verified diners who filmed 60-second reviews at your venue</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Manage All ({placeVideos.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {placeVideos.slice(0, 3).map((vid) => (
                      <div 
                         key={vid.id}
                        className="border border-white/[0.06] rounded-[24px] p-2 flex flex-col justify-between hover:border-white/[0.12] transition-colors bg-white/[0.02] shadow-inner shadow-white/[0.01]"
                      >
                        <div>
                          {/* Video Poster Thumbnail Frame */}
                          <div 
                             onClick={() => setActiveVideoModal(vid)}
                            className="w-full aspect-[4/5] rounded-[18px] overflow-hidden bg-[#050505] relative mb-3 cursor-pointer group"
                          >
                            <img
                              src={vid.thumbnailUrl || vid.author?.avatar}
                              alt={vid.dishOrItem || 'Video Review'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/40 flex flex-col justify-between p-3 text-white">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-black text-white flex items-center gap-1 border border-white/20">
                                  <Video className="w-2.5 h-2.5 text-red-400" /> VIDEO REVIEW
                                </span>
                                <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-[10px] font-mono font-medium text-white border border-white/10">
                                  0:{vid.durationSeconds || 15}
                                </span>
                              </div>
                              <div className="self-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </div>
                              <div className="flex items-center justify-between mt-auto">
                                <span className="text-xs font-bold text-white drop-shadow-md truncate">
                                  {vid.dishOrItem || 'Customer Review'}
                                </span>
                                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-300 text-[10px] font-bold shrink-0 border border-amber-500/30">
                                  ★ {vid.rating || 5}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Author Info */}
                          <div className="flex items-center gap-2.5 mb-3 px-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenCreator && vid.author) {
                                  onOpenCreator(vid.author);
                                }
                              }}
                              className="flex items-center gap-2.5 truncate text-left group cursor-pointer hover:opacity-85 transition-opacity flex-1 min-w-0"
                            >
                              <img
                                src={vid.author?.avatar}
                                alt={vid.author?.name}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-blue-400/50 transition-all shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="truncate flex-1 min-w-0">
                                <div className="text-sm font-bold text-zinc-200 group-hover:text-blue-400 transition-colors truncate">
                                  {vid.author?.name || 'Customer Review'}
                                </div>
                                <div className="text-[10px] text-zinc-500 truncate">
                                  {formatRecordedDate(vid.recordedAt, vid.createdAtMs)}
                                </div>
                              </div>
                            </button>
                          </div>
                          
                          {/* AI Transcript - Glass Design */}
                          <div className="bg-gradient-to-br from-indigo-900/10 to-purple-900/10 p-3 rounded-2xl border border-dashed border-indigo-500/20 mb-1 mx-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider mb-1.5">
                              <Sparkles className="w-3 h-3" />
                              <span>AI Video Transcript</span>
                            </div>
                            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed italic font-serif">
                              "{vid.caption}"
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 pb-1 px-2 border-t border-white/[0.04] mt-3">
                          <span className="font-semibold text-[11px] text-zinc-400">{currentPlace.website ? new URL(currentPlace.website).hostname : 'View Link'}</span>
                          <button
                            onClick={() => setActiveVideoModal(vid)}
                            className="text-blue-400 text-xs font-bold hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Watch Video
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            `;

fs.writeFileSync(file, beforeFeed + newFeed + afterFeed);
console.log('Feed patched.');
