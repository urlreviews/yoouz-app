const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreatorDrawer.tsx', 'utf8');

const regex = /<div className="flex items-center gap-1">\s*<span className="font-bold text-white">\{avgRating\}<\/span>\s*<div className="flex items-center text-zinc-300">\s*\{Array\.from\(\{ length: 5 \}\)\.map\(\(\_, i\) => \(\s*<Star\s*key=\{i\}\s*className=\{`w-3\.5 h-3\.5 \$\{\s*i < Math\.floor\(parseFloat\(avgRating\)\)\s*\? "fill-amber-400 text-amber-400"\s*: "text-zinc-700"\s*\}`\}\s*\/>\s*\)\)\}\s*<\/div>\s*<\/div>\s*<span className="text-zinc-400 font-medium">\s*\(\{authorVideos\.length\} \{authorVideos\.length === 1 \? "review" : "reviews"\}\)\s*<\/span>/;

const replacement = `<span className="text-zinc-400 font-medium">
              {authorVideos.length} {authorVideos.length === 1 ? "review" : "reviews"}
            </span>`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/CopoCreatorDrawer.tsx', code);
    console.log("Patched CopoCreatorDrawer.tsx successfully");
} else {
    console.log("Regex not found in CopoCreatorDrawer.tsx");
}
