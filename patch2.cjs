const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const strToFind = `{/* Code Snippet Box */}`;
let startIndex = code.indexOf(strToFind);
let endSnippet = code.indexOf('</div>', code.indexOf('</div>', code.indexOf('</div>', startIndex) + 1) + 1) + 6;

// Replace the snippet variables
let oldSnippet = code.substring(startIndex, endSnippet);
let newSnippet = oldSnippet.replace(/\\n  data-theme="\\$\\{embedTheme\\}"\\n  data-layout="\\$\\{embedLayout\\}"\\n  data-accent="\\$\\{embedAccentColor\\}"\\n  data-star-filter="\\$\\{embedStarFilter\\}"\\n  data-show-stars="\\$\\{embedShowStars\\}"\\n  data-show-verified="\\$\\{embedShowVerifiedBadge\\}"\\n  data-show-trust-header="\\$\\{embedShowTrustHeader\\}"/g, '\\n  data-theme="minimal_dark"\\n  data-layout="grid"\\n  data-accent="#ffffff"');

newSnippet = newSnippet.replace(/theme=\\$\\{embedTheme\\}&layout=\\$\\{embedLayout\\}&accent=\\$\\{encodeURIComponent\\(embedAccentColor\\)\\}/g, 'theme=minimal_dark&layout=grid&accent=%23ffffff');

code = code.substring(0, startIndex) + newSnippet + code.substring(endSnippet);

// We have two "Live Website Preview Container" comments now.
code = code.replace('{/* Live Website Preview Container */}\\n{/* Code Snippet Box */}', '{/* Code Snippet Box */}');

fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
console.log("Success patch2");
