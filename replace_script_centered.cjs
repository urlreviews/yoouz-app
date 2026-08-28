const fs = require('fs');
let content = fs.readFileSync('src/components/CopoDiscoverView.tsx', 'utf-8');
const searchString = `  return (
    <div
      id="copo-discover-root"`;
const index = content.indexOf(searchString);
if (index === -1) {
  console.log("Not found");
  process.exit(1);
}
const newReturn = `  return (
    <div
      id="copo-discover-root"
      className="flex-1 h-full w-full relative overflow-y-auto bg-white flex flex-col items-center p-6 pt-10 pb-20 select-none"
    >
      <div className="w-full max-w-3xl flex flex-col items-center animate-in fade-in zoom-in duration-500 mt-[4vh] sm:mt-[6vh]">
        
        {/* Central Logo / Icon */}
        <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mb-6 shadow-xs animate-fade-in shrink-0">
          <Users className="w-8 h-8 text-[#1a73e8]" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight text-center mb-6">
          Discover Reviewers
        </h1>

        {/* Search Bar - styled exactly like the Search page */}
        <div className="w-full max-w-xl mb-12">
          <div className="w-full relative group shadow-sm rounded-full bg-white border border-zinc-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-[#1a73e8] transition-colors" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviewer by name..."
              className="block w-full pl-12 pr-28 py-3.5 rounded-full text-[14px] bg-transparent focus:outline-none placeholder:text-zinc-400 text-zinc-900"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-24 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                title="Clear search query"
              >
                <span className="text-xl font-medium leading-none">×</span>
              </button>
            )}
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              <button
                type="button"
                className="h-9 px-5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Reviewers List */}
        <div className="w-full text-left animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {query.trim() ? \`Search Results (\${displayedReviewers.length})\` : \`Active Reviewers (\${displayedReviewers.length})\`}
            </span>
            <span className="text-zinc-400 hidden sm:block font-medium">Tap card to view profile</span>
          </div>

          {displayedReviewers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {displayedReviewers.map((reviewer, idx) => {
                return (
                  <div
                    key={\`reviewer-card-\${reviewer.author.handle}-\${idx}\`}
                    onClick={() => onOpenCreator(reviewer.author)}
                    className="bg-white rounded-2xl border border-zinc-200 hover:border-blue-300 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    {/* Left: Avatar + Name + Metadata */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={reviewer.author.avatar}
                          alt={reviewer.author.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-zinc-100 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        {reviewer.author.isVerified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#1a73e8] text-white rounded-full flex items-center justify-center ring-2 ring-white">
                            <CheckCircle className="w-3 h-3 fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate group-hover:text-[#1a73e8] transition-colors">
                            {reviewer.author.name}
                          </h3>
                          {reviewer.author.isVerified && (
                            <span className="text-[9px] font-black bg-blue-50 text-[#1a73e8] px-1.5 py-0.5 rounded border border-blue-100 shrink-0 uppercase">
                              Verified
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-zinc-500 font-medium truncate mb-1">
                          {reviewer.author.handle.startsWith("@") ? reviewer.author.handle : \`@\${reviewer.author.handle}\`}
                        </p>
                        
                        {reviewer.count > 0 ? (
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {reviewer.avgRating}
                            </span>
                            <span>•</span>
                            <span>{reviewer.count} {reviewer.count === 1 ? "video review" : "video reviews"}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            Community Reviewer • 0 reviews
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Navigation Indicator */}
                    <div className="shrink-0 flex items-center pl-2 text-zinc-400 group-hover:text-[#1a73e8] transition-colors">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center shadow-sm">
              <p className="text-sm font-bold text-zinc-800 mb-1">
                No reviewers found matching "{query}"
              </p>
              <p className="text-xs text-zinc-500">
                Try searching by their name.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;
content = content.substring(0, index) + newReturn;
fs.writeFileSync('src/components/CopoDiscoverView.tsx', content, 'utf-8');
console.log("Replaced successfully centered layout");
