const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const tabStart = "{/* TAB 3: WEBSITE EMBED WIDGET */}";
const tabEnd = "{/* TAB 4: QR CODES & REVIEW INVITES STUDIO */}";

const startIndex = code.indexOf(tabStart);
const endIndex = code.indexOf(tabEnd);

const newTab = `{/* TAB 3: WEBSITE EMBED WIDGET */}
            {activeTab === 'embed' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-zinc-900 rounded-3xl border border-zinc-800 text-white p-5 md:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                        <span>Official Yoouz Video Reviews Website Embed</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-extrabold uppercase tracking-wide">
                          Pro Feature
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                        Embed authentic, high-converting video reviews directly on your website or reservation page with automatic real-time sync.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 fill-current text-white" /> {pinnedVideoIds.length}/3 Pinned
                      </span>
                      {hiddenVideoIds.length > 0 && (
                        <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5" /> {hiddenVideoIds.length} Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* Live Website Preview Container */}
                    <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-zinc-200" />
                            Live Website Preview (GRID MODE)
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {/* Desktop / Mobile Device Mode Toggle */}
                            <div className="bg-zinc-900 p-0.5 rounded-xl border border-zinc-800 flex items-center">
                              <button
                                type="button"
                                onClick={() => setEmbedDeviceMode('desktop')}
                                className={\`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 \${
                                  embedDeviceMode === 'desktop'
                                    ? 'bg-zinc-800 text-white shadow-xs'
                                    : 'text-zinc-400 hover:text-white'
                                }\`}
                              >
                                🖥️ Desktop
                              </button>
                              <button
                                type="button"
                                onClick={() => setEmbedDeviceMode('mobile')}
                                className={\`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 \${
                                  embedDeviceMode === 'mobile'
                                    ? 'bg-zinc-800 text-white shadow-xs'
                                    : 'text-zinc-400 hover:text-white'
                                }\`}
                              >
                                📱 Mobile App
                              </button>
                            </div>

                            <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 text-[10px] font-bold border border-zinc-800 hidden sm:inline-block">
                              Auto-Sync
                            </span>
                          </div>
                        </div>

                        {/* Rendered Widget Simulation Container (Desktop or Physical Smartphone Frame) */}
                        <div className={embedDeviceMode === 'mobile' ? "max-w-[340px] mx-auto bg-zinc-950 border-[8px] border-zinc-800 rounded-[44px] px-3.5 py-4 shadow-2xl relative my-2 overflow-hidden transition-all ring-1 ring-zinc-700/50" : "widget-simulation-container p-6 rounded-3xl border border-zinc-800 bg-zinc-900 text-white shadow-xl transition-all"}>
                          {embedDeviceMode === 'mobile' && (
                            <div className="mb-3 px-2 flex items-center justify-between text-[11px] font-semibold text-zinc-400 select-none">
                              <span>9:41</span>
                              {/* Dynamic Island Notch */}
                              <div className="w-24 h-5 bg-zinc-900 mx-auto rounded-full flex items-center justify-center gap-1.5 px-2 border border-zinc-800">
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-950"></div>
                                <div className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse"></div>
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                <span>5G</span>
                                <div className="w-4 h-2.5 border border-zinc-400 rounded-xs p-0.5 flex items-center">
                                  <div className="w-full h-full bg-zinc-400 rounded-2xs"></div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Super Luxury Yoouz Brand Trust Header */}
                          <div className={\`p-4 rounded-2xl mb-4 border border-zinc-700/80 bg-zinc-800/90 text-white flex flex-col \${embedDeviceMode === 'mobile' ? 'gap-3' : 'sm:flex-row sm:items-center justify-between'} transition-all\`}>
                            <div className="flex items-center gap-3">
                              {/* Official Yoouz Brand Icon Badge */}
                              <div 
                                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-inner shrink-0"
                              >
                                <span className="text-zinc-950 text-xl font-black">★</span>
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white tracking-tight">{currentPlace.name}</span>
                                  <BadgeCheck className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex items-center gap-0.5 text-amber-400">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                  </div>
                                  <span className="text-[11px] font-bold text-white">4.9</span>
                                  <span className="text-[11px] text-zinc-400">•</span>
                                  <span className="text-[11px] text-zinc-300 font-medium">
                                    {placeVideos.length} Reviews
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Write Review CTA Button */}
                            <a
                              href={\`/#/record_review?placeId=\${selectedPlaceId}\`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1.5 rounded-lg text-zinc-950 bg-white hover:bg-zinc-100 text-[10px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer border border-zinc-200"
                            >
                              <Video className="w-3 h-3" />
                              <span>Review</span>
                            </a>
                          </div>

                          {/* Video Simulation Display (GRID MODE ONLY) */}
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

                          {embedDeviceMode === 'mobile' && (
                            <div className="w-28 h-1 bg-zinc-700 mx-auto rounded-full mt-3"></div>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 mt-4 text-center flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-zinc-400" />
                        <span>Tap any video thumbnail to test the immersive HD video review player.</span>
                      </div>
                    </div>

                    {/* Code Snippet Box */}
                    <div className="bg-zinc-900 rounded-2xl p-4 text-white font-mono text-xs space-y-3 shadow-md border border-zinc-800">
                      <div className="flex items-center justify-between text-zinc-200 text-[11px]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEmbedFormat('script')}
                            className={\`px-3 py-1 rounded-full text-xs font-sans font-bold cursor-pointer border transition-all \${
                              embedFormat === 'script' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:text-white'
                            }\`}
                          >
                            JS Script Tag
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmbedFormat('iframe')}
                            className={\`px-3 py-1 rounded-full text-xs font-sans font-bold cursor-pointer border transition-all \${
                              embedFormat === 'iframe' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:text-white'
                            }\`}
                          >
                            iFrame Tag
                          </button>
                        </div>
                        <button
                          onClick={copyEmbedCode}
                          className="flex items-center gap-1 text-white hover:text-zinc-200 transition-colors cursor-pointer font-sans font-bold"
                        >
                          {isCodeCopied ? <Check className="w-3.5 h-3.5 text-zinc-200" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCodeCopied ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto text-[11px] text-zinc-200 py-1 leading-relaxed">
                        {embedFormat === 'script' ? (
                          <code>{\`<div id="yoouz-widget"\\n  data-place-id="\${selectedPlaceId}"\\n  data-theme="minimal_dark"\\n  data-layout="grid"\\n  data-accent="#ffffff"\${pinnedVideoIds.length > 0 ? \`\\n  data-pinned-ids="\${pinnedVideoIds.join(',')}"\` : ''}\${hiddenVideoIds.length > 0 ? \`\\n  data-hidden-ids="\${hiddenVideoIds.join(',')}"\` : ''}>\\n</div>\\n<script src="https://cdn.yoouz.com/embed/v2.js" async defer></script>\`}</code>
                        ) : (
                          <code>{\`<iframe src="https://yoouz.com/embed/widget?placeId=\${selectedPlaceId}&theme=minimal_dark&layout=grid&accent=%23ffffff" \\n  width="100%" height="480" frameBorder="0" loading="lazy" allow="autoplay; encrypted-media">\\n</iframe>\`}</code>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
`;

code = code.substring(0, startIndex) + newTab + '\n            ' + code.substring(endIndex);
fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
console.log("Success patch8");
