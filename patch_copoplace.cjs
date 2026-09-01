const fs = require('fs');
const file = 'src/components/CopoPlaceDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /  const dynamicAvgRating = dynamicReviewCount > 0 \n    \? rawPlaceVideos\.reduce\(\(acc, v\) => acc \+ v\.rating, 0\) \/ dynamicReviewCount \n    : \(place\.rating \|\| 5\.0\);/,
  `  const dynamicAvgRating = dynamicReviewCount > 0 
    ? rawPlaceVideos.reduce((acc, v) => acc + (v.rating || 5), 0) / dynamicReviewCount 
    : 0;`
);

content = content.replace(
  /          <div className="flex items-center gap-1">\n            <span className="font-bold text-white md:text-white">\{dynamicAvgRating\.toFixed\(1\)\}<\/span>\n            <div className="flex items-center text-zinc-300">\n              \{Array\.from\(\{ length: 5 \}\)\.map\(\(_, i\) => \(\n                <Star\n                  key=\{i\}\n                  className=\{\`w-3\.5 h-3\.5 \$\{\n                    i < Math\.floor\(dynamicAvgRating\)\n                      \? "fill-amber-400 text-amber-400"\n                      : "text-zinc-700"\n                  \}\`\}\n                \/>\n              \)\)\}\n            <\/div>\n          <\/div>\n          <span className="text-zinc-400 font-medium">\n            \(\{dynamicReviewCount\.toLocaleString\(\)\} \{dynamicReviewCount === 1 \? "review" : "reviews"\}\)\n          <\/span>/,
  `          {dynamicReviewCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-bold text-white md:text-white">{dynamicAvgRating.toFixed(1)}</span>
              <div className="flex items-center text-zinc-300 gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={\`w-3.5 h-3.5 \${
                      i < Math.round(dynamicAvgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-zinc-800 text-zinc-800"
                    }\`}
                  />
                ))}
              </div>
            </div>
          )}
          <span className="text-zinc-400 font-medium">
            ({dynamicReviewCount.toLocaleString()} {dynamicReviewCount === 1 ? "review" : "reviews"})
          </span>`
);

fs.writeFileSync(file, content);
