const fs = require('fs');
const file = 'src/components/CopoSearchView.tsx';
let content = fs.readFileSync(file, 'utf8');

const ratingLogic = `  const placeVideos = searchedPlace 
    ? videos.filter(v => isPlaceReviewMatch(v, searchedPlace)) 
    : [];

  const averageRating = placeVideos.length > 0
    ? placeVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / placeVideos.length
    : 0;
  const totalReviewsCount = placeVideos.length;`;

content = content.replace(/  const placeVideos = searchedPlace \n    \? videos\.filter\(v => isPlaceReviewMatch\(v, searchedPlace\)\) \n    : \[\];/, ratingLogic);

const ratingUI = `                  <a href={searchedPlace.website} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white hover:underline flex items-center gap-1.5 font-medium text-sm mt-1 mb-2">
                    <Globe className="w-4 h-4 text-zinc-400" />
                    {searchedPlace.brandDomain || searchedPlace.website?.replace(/^(https?:\\/\\/)?(www\\.)?/, "").replace(/\\/$/, "")}
                  </a>
                  
                  {/* Star Rating Row */}
                  {totalReviewsCount > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={\`w-5 h-5 \${i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "fill-zinc-800 text-zinc-800"}\`}
                          />
                        ))}
                      </div>
                      <span className="text-white font-bold text-lg">{averageRating.toFixed(1)}</span>
                      <span className="text-zinc-400 font-medium text-sm">({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  )}`;

content = content.replace(/                  <a href=\{searchedPlace\.website\} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white hover:underline flex items-center gap-1\.5 font-medium text-sm">\n                    <Globe className="w-4 h-4 text-zinc-400" \/>\n                    \{searchedPlace\.brandDomain \|\| searchedPlace\.website\?\.replace\(\/\^\(https\?:\\\/\\\/\)\?\(www\\\.\)\?\/\, ""\)\.replace\(\/\\\/\$\/\, ""\)\}\n                  <\/a>/, ratingUI);

fs.writeFileSync(file, content);
