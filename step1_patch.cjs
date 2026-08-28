const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const startMarker = '{/* STEP 1: PLACE & RATING SELECTION (Mobile & Desktop) */}';
const endMarker = '{/* STEP 2: FULLSCREEN CAMERA STUDIO & PLAYBACK (Mobile & Desktop) */}';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const newStep1 = `        {/* STEP 1: PLACE & RATING SELECTION (Responsive Light/Dark) */}
        {step === 1 && (
          <div className="flex flex-col h-full w-full bg-zinc-950 md:bg-white relative z-[260]">
            {/* Step 1 Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 md:border-zinc-200 bg-zinc-900/50 md:bg-zinc-50/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/25">
                  <Video className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold text-white md:text-zinc-900">Record Video Review</h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 md:bg-blue-100 text-blue-400 md:text-blue-700 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                        v3 • Step 1 of 2
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium">
                      Select business & rate your experience
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-zinc-800 md:bg-zinc-200 hover:bg-zinc-700 md:hover:bg-zinc-300 flex items-center justify-center text-zinc-300 md:text-zinc-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1 Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {(errorMessage || errorMsg) && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-900/20 md:bg-red-50 border border-red-800 md:border-red-200 text-red-400 md:text-red-700 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage || errorMsg}</span>
                </div>
              )}

              {/* Responsive Place Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-100 md:text-zinc-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Select Place or Business</span>
                </label>
                
                {selectedPlace ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-900/10 md:bg-blue-50/50 border border-blue-500/20 md:border-blue-200 shadow-lg md:shadow-sm">
                    <CopoBrandLogo
                      domain={selectedPlace.brandDomain}
                      name={selectedPlace.name}
                      website={selectedPlace.website}
                      logoUrl={selectedPlace.logoUrl}
                      bannerUrl={selectedPlace.bannerUrl || selectedPlace.ogImage}
                      className="w-14 h-14 rounded-xl border border-zinc-800 md:border-zinc-200 bg-white overflow-hidden flex items-center justify-center p-1 shrink-0"
                      imageClassName="w-full h-full object-contain rounded-lg"
                      fallbackTextClassName="font-bold text-xl text-zinc-900"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white md:text-zinc-900 text-sm truncate">{formatBusinessName(selectedPlace.name)}</h4>
                      <p className="text-xs text-zinc-400 md:text-zinc-500 truncate">{selectedPlace.address || selectedPlace.city}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPlace(null)}
                      className="shrink-0 text-xs font-bold text-blue-400 md:text-blue-600 hover:text-blue-300 md:hover:text-blue-700 px-3 py-2 bg-zinc-900 md:bg-white rounded-xl border border-zinc-800 md:border-zinc-200 hover:border-zinc-700 md:hover:border-zinc-300 transition-all cursor-pointer shadow-sm"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Paste business website URL..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-800 md:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 md:focus:ring-blue-500/30 focus:border-blue-500 text-sm bg-zinc-900 md:bg-white text-white md:text-zinc-900 placeholder:text-zinc-500 md:placeholder:text-zinc-400 transition-all shadow-sm"
                    />
                    {searchQuery.trim().length > 0 && (
                      <div className="max-h-56 overflow-y-auto border border-zinc-800 md:border-zinc-200 rounded-2xl divide-y divide-zinc-800 md:divide-zinc-100 bg-zinc-900 md:bg-white shadow-xl">
                        {filteredPlaces.length > 0 ? (
                          filteredPlaces.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPlace(p);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-3 p-4 bg-zinc-900 md:bg-white hover:bg-zinc-800 md:hover:bg-zinc-50 cursor-pointer transition-colors"
                            >
                              <CopoBrandLogo
                                domain={p.brandDomain}
                                name={p.name}
                                website={p.website}
                                logoUrl={p.logoUrl}
                                className="w-10 h-10 rounded-lg border border-zinc-800 md:border-zinc-200 bg-white overflow-hidden flex items-center justify-center p-1 shrink-0"
                                fallbackTextClassName="font-bold text-zinc-900"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-sm text-white md:text-zinc-900 truncate">{formatBusinessName(p.name)}</h5>
                                <p className="text-[11px] text-zinc-500 md:text-zinc-400 truncate">{p.address || p.city}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            onClick={() => {
                              const newPlace = {
                                id: "new-" + Date.now(),
                                name: formatBusinessName(searchQuery),
                                website: searchQuery,
                                brandDomain: searchQuery,
                                rating: 0,
                                reviewCount: 0,
                                source: 'yoouz' as const,
                                url: searchQuery,
                                reviews: []
                              };
                              if (onAddPlace) {
                                onAddPlace(newPlace);
                              }
                              setSelectedPlace(newPlace);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-3 p-4 bg-zinc-900 md:bg-white hover:bg-zinc-800 md:hover:bg-zinc-50 cursor-pointer transition-colors"
                          >
                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 md:bg-blue-100 text-blue-400 md:text-blue-600 border border-blue-500/20 md:border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
                              <Globe className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-sm text-white md:text-zinc-900 truncate">
                                Review "{formatBusinessName(searchQuery)}"
                              </h5>
                              <p className="text-[11px] text-zinc-500 md:text-zinc-500 font-medium">
                                Add & record a review for this domain
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 md:bg-zinc-100 flex items-center justify-center">
                              <ArrowRight className="w-4 h-4 text-blue-400 md:text-blue-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Star Rating Section */}
              {selectedPlace && (
                <div className="p-6 rounded-3xl bg-zinc-900 md:bg-zinc-50 border border-zinc-800 md:border-zinc-200 space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-white md:text-zinc-900">Your Rating</h3>
                      <p className="text-[11px] text-zinc-500 md:text-zinc-500 font-medium">Tap stars to rate your experience</p>
                    </div>
                    <div className={\`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-[0.1em] transition-all duration-300 \${
                      rating === 0
                        ? "bg-zinc-800 md:bg-zinc-200 text-zinc-500 md:text-zinc-500 border border-zinc-700 md:border-zinc-300"
                        : "bg-amber-500/20 md:bg-amber-100 text-amber-400 md:text-amber-600 border border-amber-500/30 md:border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                    }\`}>
                      {rating === 0 ? "Select Star Rating" : getRatingLabel(rating)}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 py-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1.5 cursor-pointer transition-all hover:scale-110 active:scale-90 group"
                        title={\`\${star} Star\${star > 1 ? "s" : ""}\`}
                      >
                        <Star
                          className={\`w-11 h-11 transition-all duration-300 \${
                            star <= rating 
                               ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" 
                               : "text-zinc-800 md:text-zinc-300 group-hover:text-zinc-700 md:group-hover:text-zinc-400"
                          }\`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 1 Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 md:border-zinc-200 bg-zinc-900 md:bg-white shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-zinc-400 md:text-zinc-500 hover:bg-zinc-800 md:hover:bg-zinc-100 font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedPlace) {
                    setErrorMessage("Please select a place or business first.");
                    return;
                  }
                  if (rating === 0) {
                    setErrorMessage("Please select a star rating before proceeding.");
                    return;
                  }
                  setErrorMessage(null);
                  setStep(2);
                  startCamera();
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95 group"
              >
                <span>Proceed to Camera</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        `;

const newCode = code.substring(0, startIndex) + newStep1 + code.substring(endIndex);
fs.writeFileSync('src/components/CopoCreateModal.tsx', newCode);
console.log("Successfully patched Step 1 UI.");
