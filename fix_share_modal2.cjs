const fs = require('fs');
let code = fs.readFileSync('src/components/CopoShareModal.tsx', 'utf8');

code = code.replace(/}&author=\$\{encodeURIComponent\(video\.author\?\.name \|\| "Reviewer"\)\}&rating=\$\{video\.rating \|\| 5\}&v=4`\n\s*: "\/api\/og-image\.png\?v=4"\n\s*}/, '}');

fs.writeFileSync('src/components/CopoShareModal.tsx', code);
console.log("Fixed syntax");
