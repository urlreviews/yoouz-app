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
      className="flex-1 h-full overflow-y-auto bg-zinc-50 flex flex-col items-center p-6 pt-10 pb-20 select-none"
    >
      <div className="w-full max-w-4xl flex flex-col animate-in fade-in duration-300">
        
        {/* Header Block: Left-aligned, side-by-side with icon */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#1a73e8]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Discover Reviewers
            </h1>
          </div>
        </div>

        {/* Search Bar - Full width */}
        <div className="w-full mb-8">
          <div className="relative flex items-center shadow-sm hover:shadow-md focus-within:shadow-md transition-all rounded-full border border-zinc-200 bg-white">
            <Search className="w-5 h-5 text-zinc-400 absolute left-4.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviewer by name..."
              className="w-full pl-12 pr-12 py-3 sm:py-3.5 rounded-full text-sm font-medium text-zinc-800 focus:outline-none placeholder:text-zinc-400 bg-transparent"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                title="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Reviewers List / Grid */}
        <div className="w-full mt-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1a73e8]" />
              {query.trim() ? \`Search Results (\${displayedReviewers.length})\` : \`Active Reviewers (\${displayedReviewers.length})\`}
            </span>
            <span className="text-[#1a73e8] hidden sm:block">Tap card to view profile</span>
          </div>

          {displayedReviewers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedReviewers.map((reviewer, idx) => {
                return (
                  <div
                    key={\`reviewer-card-\${reviewer.author.handle}-\${idx}\`}
                    onClick={() => onOpenCreator(reviewer.author)}
                    className="bg-white rounded-2xl border border-zinc-200 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-row items-center justify-between gap-4 group"
                  >
                    {/* Left: Avatar + Name + Metadata */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={reviewer.author.avatar}
                          alt={reviewer.author.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-zinc-100 group-hover:scale-105 transition-transform shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate group-hover:text-[#1a73e8] transition-colors">
                            {reviewer.author.name}
                          </h3>
                          {reviewer.author.isVerified && (
                            <CheckCircle className="w-4 h-4 text-[#1a73e8] fill-[#1a73e8]/10 shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
                          <span className="bg-zinc-100 px-2.5 py-0.5 rounded-md text-zinc-700">
                            {reviewer.count} {reviewer.count === 1 ? "Video" : "Videos"}
                          </span>
                          <span className="text-zinc-400">{reviewer.author.followersCount || 0} followers</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Portfolio Button */}
                    <div className="shrink-0 pl-2">
                      <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 text-[#1a73e8] text-xs font-bold group-hover:bg-[#1a73e8] group-hover:text-white transition-colors border border-blue-100 shadow-sm">
                        Portfolio <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                      <div className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-[#1a73e8] group-hover:bg-[#1a73e8] group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center shadow-xs">
              <p className="text-sm font-bold text-zinc-800 mb-1">
                No reviewers found matching "{query}"
              </p>
              <p className="text-xs text-zinc-500">
                Try searching by a different name.
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
console.log("Replaced successfully");
